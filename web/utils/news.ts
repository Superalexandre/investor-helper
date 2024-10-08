import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { news as newsSchema, newsRelatedSymbols as newsRelatedSymbolsSchema, newsArticle as newsArticleSchema } from "../../db/schema/news.js"
import { symbols as symbolsSchema } from "../../db/schema/symbols.js"
import { and, desc, eq, gte, like, lte } from "drizzle-orm"
import config from "../../config.js"

import refreshSymbol from "./refreshSymbol.js"
import { parse } from "node-html-parser"

async function getNews({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const allNews = await db
        .select()
        .from(newsSchema)
        .limit(limit)
        .offset(limit * (page - 1))
        .orderBy(desc(newsSchema.published))

    const news = []
    for (const newsItem of allNews) {
        const relatedSymbols = await db
            .select()
            .from(newsRelatedSymbolsSchema)
            .where(eq(newsRelatedSymbolsSchema.newsId, newsItem.id))
            .innerJoin(symbolsSchema, eq(newsRelatedSymbolsSchema.symbol, symbolsSchema.symbolId))

        news.push({
            news: newsItem,
            relatedSymbols: relatedSymbols
        })
    }

    return news
}

async function getNewsById({ id }: { id: string }) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    // Get the news from the database
    const newsResults = await db
        .select()
        .from(newsSchema)
        .innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
        .where(eq(newsSchema.id, id))
    const news = newsResults[0]

    // Get the related symbols
    const relatedSymbolsResults = await db
        .select()
        .from(newsRelatedSymbolsSchema)
        .where(eq(newsRelatedSymbolsSchema.newsId, id))
        .innerJoin(symbolsSchema, eq(newsRelatedSymbolsSchema.symbol, symbolsSchema.symbolId))

    return {
        news,
        relatedSymbols: relatedSymbolsResults
    }
}

async function fetchNews() {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const response = await fetch(config.url.news)
    const data = await response.text()

    const root = parse(data)

    // Get the script tag with type="application/prs.init-data+json" inside of the div data-id="react-root"
    const rawNews = root.querySelector("div[data-id='react-root'] script[type='application/prs.init-data+json']")?.text

    if (!rawNews) return console.error("No news found")

    const jsonNews = JSON.parse(rawNews)
    const dynamicKey = Object.keys(jsonNews)[0]

    const json = jsonNews[dynamicKey]

    if (!json) return console.error("No news found")

    const news = json.blocks[0].news.items

    if (!news || news.length === 0) return console.error("No news found")

    // Make a deep copy of the news array
    const newsCopy = [...news]

    for (const newsItem of newsCopy) {
        const exists = await db
            .select()
            .from(newsSchema)
            .where(eq(newsSchema.id, newsItem.id))

        if (exists.length > 0) continue

        const url = new URL(config.url.originLocale + newsItem.storyPath)

        const fullArticle = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",

                "Referer": config.url.eventsOrigin,
                "Origin": config.url.eventsOrigin
            }
        })

        const articleData = await fullArticle.text()
        const articleRoot = parse(articleData)

        const article = articleRoot.querySelector("div[class='tv-content'] script[type='application/prs.init-data+json']")?.text

        if (!article) return console.error("No article found")

        const articleJson = JSON.parse(article)
        const dynamicKeyArticle = Object.keys(articleJson)[0]

        const jsonArticle = articleJson[dynamicKeyArticle]

        if (!jsonArticle) return console.error("No article found (jsonArticle)")

        const jsonDescription = JSON.stringify(jsonArticle.story.astDescription)

        const importanceScore = getNewsImportanceScore(jsonDescription, jsonArticle.story.astDescription, newsItem.relatedSymbols)

        newsItem.article = {
            // htmlDescription: htmlDescription,
            // textDescription: textDescription,
            jsonDescription: jsonDescription,
            shortDescription: jsonArticle.story.shortDescription,
            copyright: jsonArticle.story.copyright,
            importanceScore: importanceScore
        }
    }

    return newsCopy
}

async function saveFetchNews() {
    console.log("Fetching news")

    // const sqlite = new Database("./db/sqlite.db")
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const newsList = await fetchNews()
    if (!newsList) return

    const newsValues = []
    const newsRelatedSymbolsValues = []
    const newsArticleValues = []

    for (const news of newsList) {
        // Check if the news already exists
        const exists = await db
            .select()
            .from(newsSchema)
            .where(eq(newsSchema.id, news.id))

        // Insert only if the news does not exist (to refresh the symbols)
        if (exists.length === 0) {
            // await db
            //     .insert(newsSchema)
            //     .values({
            //         id: news.id,
            //         title: news.title,
            //         storyPath: news.storyPath,
            //         sourceLogoId: news.sourceLogoId,
            //         published: news.published,
            //         source: news.source,
            //         urgency: news.urgency,
            //         provider: news.provider,
            //         link: news.link
            //     })

            newsValues.push({
                id: news.id,
                title: news.title,
                storyPath: news.storyPath,
                sourceLogoId: news.sourceLogoId,
                published: news.published,
                source: news.source,
                urgency: news.urgency,
                provider: news.provider,
                link: news.link,
                mainSource: "tradingview",
                lang: "fr-FR",
                importanceScore: news.article.importanceScore
            })
        }


        if (news.relatedSymbols && news.relatedSymbols.length > 0) {
            for (const symbol of news.relatedSymbols) {
                await refreshSymbol({ symbolId: symbol.symbol })

                if (exists.length === 0) {
                    newsRelatedSymbolsValues.push({
                        newsId: news.id,
                        symbol: symbol.symbol
                    })
                    // await db
                    //     .insert(newsRelatedSymbolsSchema)
                    //     .values({
                    //         newsId: news.id,
                    //         symbol: symbol.symbol
                    //     })
                }

            }
        }

        if (news.article && exists.length === 0) {
            // await db
            //     .insert(newsArticleSchema)
            //     .values({
            //         newsId: news.id,
            //         date: news.published,
            //         jsonDescription: news.article.jsonDescription,
            //         shortDescription: news.article.shortDescription,
            //         copyright: news.article.copyright
            //     })

            newsArticleValues.push({
                newsId: news.id,
                date: news.published,
                jsonDescription: news.article.jsonDescription,
                shortDescription: news.article.shortDescription,
                copyright: news.article.copyright
            })
        }
    }

    if (newsValues.length > 0) {
        await db
            .insert(newsSchema)
            .values(newsValues)
    }

    if (newsRelatedSymbolsValues.length > 0) {
        await db
            .insert(newsRelatedSymbolsSchema)
            .values(newsRelatedSymbolsValues)
    }

    if (newsArticleValues.length > 0) {
        await db
            .insert(newsArticleSchema)
            .values(newsArticleValues)
    }

    console.log(`Inserted ${newsValues.length} news, ${newsRelatedSymbolsValues.length} related symbols and ${newsArticleValues.length} articles`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNewsImportanceScore(description: string, article: any, relatedSymbols: unknown[]) {
    let score = 0

    const importantKeywords = ["annonce", "décision", "plan", "changement", "crise"]
    importantKeywords.forEach((keyword) => {
        if (description.toLowerCase().includes(keyword)) {
            score += 10
        }
    })

    // Flatten the article tex
    let articleText = ""
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatten = (node: any) => {
        // console.log(node)
        if (typeof node === "string") {
            articleText += node
        }

        if (node.children) {
            for (const child of node.children) {
                flatten(child)
            }
        }
    }

    flatten(article)

    // let symbolCount = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getRelatedSymbols = (node: any) => {
        if (node.type === "symbol") {
            score += 5

            // symbolCount++
        }

        if (node.children) {
            for (const child of node.children) {
                getRelatedSymbols(child)
            }
        }
    }

    getRelatedSymbols(article)

    const wordCount = articleText.split(" ").length

    if (wordCount > 300) {
        score += 20
    } else if (wordCount > 100) {
        score += 10
    }

    const highImpactKeywords = [
        "hausse",
        "baisse",
        "chute",
        "augmentation",
        "diminution",
    ]

    highImpactKeywords.forEach((keyword) => {
        if (articleText.toLowerCase().includes(keyword)) score += 15
    })

    // Add 5 points for each related symbol
    score += relatedSymbols ? relatedSymbols.length * 5 : 0

    // console.log(`Score: ${score}, word count: ${wordCount}, symbol count: ${symbolCount}, related symbols: ${relatedSymbols ? relatedSymbols.length : 0}`)

    return score
}

async function searchNews(search: string) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const news = await db
        .select()
        .from(newsSchema)
        .where(
            like(newsSchema.title, `%${search}%`)
        )
        .orderBy(desc(newsSchema.published))

    return news
}

async function getNewsFromDates(from: number, to: number) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const news = await db
        .select({
            title: newsSchema.title,
            published: newsSchema.published,
            article: newsArticleSchema.jsonDescription,
            description: newsArticleSchema.shortDescription,
        })
        .from(newsSchema)
        .innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
        .where(
            and(
                eq(newsSchema.lang, "fr-FR"),
                gte(newsSchema.importanceScore, 20),
                gte(newsSchema.published, from),
                lte(newsSchema.published, to)
            )
        )

    return news
}

async function getLastImportantNews(from: Date, to: Date, importance: number, limit: number) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const fromConvert = from.getTime() / 1000
    const toConvert = to.getTime() / 1000

    const news = await db
        .select()
        .from(newsSchema)
        .innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
        .where(
            and(
                eq(newsSchema.lang, "fr-FR"),
                gte(newsSchema.importanceScore, importance),
                gte(newsSchema.published, fromConvert),
                lte(newsSchema.published, toConvert)
            )
        )
        .limit(limit)
        .orderBy(desc(newsSchema.published))

    // if (!news || news.length === 0) {
    // const newFrom = new Date(from)
    // newFrom.setDate(newFrom.getDate() - 1)

    // return getLastImportantNews(newFrom.getTime(), to, importance, limit)
    // }

    return news
}

export default getNews
export {
    getNews,
    getNewsById,
    fetchNews,
    saveFetchNews,
    getNewsImportanceScore,
    searchNews,
    getNewsFromDates,
    getLastImportantNews
}
export type {
    // News,
    // FullNews,
    // GroupedNews,
}