import { parse } from "node-html-parser"
import config from "../config.js"
import { serve } from "@hono/node-server"
import app from "./server.js"
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { CronJob } from "cron"
import { news as newsSchema, newsRelatedSymbols as newsRelatedSymbolsSchema, newsArticle as newsArticleSchema } from "../db/schema/news.js"

import { eq } from "drizzle-orm"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import refreshSymbol from "./utils/refreshSymbol.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function getNews() {
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

async function saveNews() {
    console.log("Fetching news")

    // const sqlite = new Database("./db/sqlite.db")
    const sqlite = new Database(join(__dirname, "..", "db", "sqlite.db"))
    const db = drizzle(sqlite)

    const newsList = await getNews()
    if (!newsList) return

    let count = 0
    for (const news of newsList) {
        // Check if the news already exists
        const exists = await db
            .select()
            .from(newsSchema)
            .where(eq(newsSchema.id, news.id))

        // Insert only if the news does not exist (to refresh the symbols)
        if (exists.length === 0) {
            await db
                .insert(newsSchema)
                .values({
                    id: news.id,
                    title: news.title,
                    storyPath: news.storyPath,
                    sourceLogoId: news.sourceLogoId,
                    published: news.published,
                    source: news.source,
                    urgency: news.urgency,
                    provider: news.provider,
                    link: news.link
                })

            count++
        }


        if (news.relatedSymbols && news.relatedSymbols.length > 0) {
            for (const symbol of news.relatedSymbols) {
                await refreshSymbol({ symbolId: symbol.symbol })

                if (exists.length === 0) {
                    await db
                        .insert(newsRelatedSymbolsSchema)
                        .values({
                            newsId: news.id,
                            symbol: symbol.symbol
                        })
                }

            }
        }

        if (news.article && exists.length === 0) {
            await db
                .insert(newsArticleSchema)
                .values({
                    newsId: news.id,
                    date: news.published,
                    jsonDescription: news.article.jsonDescription,
                    shortDescription: news.article.shortDescription,
                    copyright: news.article.copyright
                })
        }
    }

    console.log(`Inserted ${count} news`)
}

function startServer() {
    serve({
        fetch: app.fetch,
        port: 3000
    }, (info) => {
        console.log(`Server listening on port ${info.port}`)
    })
}

// function sendNotification() {

//     sendNotifications({
//         subscriptions: [{
//             endpoint: "localhost:3000",
//             keys: {
//                 p256dh: "",
//                 auth: ""
//             }
//         }],
//         vapidDetails,
//         notification,
//     })

// }

function main() {
    startServer()

    CronJob.from({
        cronTime: "*/5 * * * *",
        onTick: function () {
            saveNews()
        },
        start: true,
        timeZone: "Europe/Paris"
    })
}

try {
    main()
} catch (err) {
    console.error("Error starting server", err)
}

process.on("uncaughtException", (err) => {
    console.error("Erreur non capturée :", err)
})