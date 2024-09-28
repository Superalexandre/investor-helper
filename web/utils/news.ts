import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { news as newsSchema, newsRelatedSymbols as newsRelatedSymbolsSchema, newsArticle as newsArticleSchema } from "../../db/schema/news.js"
import { symbols as symbolsSchema } from "../../db/schema/symbols.js"
import { desc, eq } from "drizzle-orm"
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

        newsItem.article = {
            // htmlDescription: htmlDescription,
            // textDescription: textDescription,
            jsonDescription: jsonDescription,
            shortDescription: jsonArticle.story.shortDescription,
            copyright: jsonArticle.story.copyright,
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
                lang: "fr-FR"
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

// interface FullNews<T = News> {
//     news: News;
//     news_article?: T extends NewsArticle ? T : null;
//     news_related_symbol: Symbol[] | null;
//     symbol: Symbol;
// }

// interface GroupedNews<T = News> {
//     news: News;
//     newsArticle: T extends NewsArticle ? T : null;
//     relatedSymbols: (Symbol | null)[] | null;
// }

// function group<T = News>(news: FullNews<T>[]): GroupedNews<T>[] {
//     return news.reduce((acc: GroupedNews<T>[], curr: FullNews<T>) => {
//         const existingNews = acc.find(item => item.news.id === curr.news.id)

//         if (existingNews && curr.news_related_symbol !== null && existingNews.relatedSymbols !== null) {
//             existingNews.relatedSymbols.push({ ...curr.news_related_symbol, ...curr.symbol })
//         } else {
//             acc.push({
//                 news: curr.news,
//                 newsArticle: curr.news_article as T extends NewsArticle ? T : null,
//                 relatedSymbols: curr.news_related_symbol !== null ? [{ ...curr.news_related_symbol, ...curr.symbol }] : []
//             })
//         }

//         return acc
//     }, [])
// }

export default getNews
export {
    getNews,
    getNewsById,
    fetchNews,
    saveFetchNews,
}
export type {
    // News,
    // FullNews,
    // GroupedNews,
}