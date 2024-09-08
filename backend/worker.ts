import { parse } from "node-html-parser"
import config from "../config.js"
import { serve } from "@hono/node-server"
import app from "./index.js"
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"

import { news as newsSchema } from "../db/schema/news.js"
import { newsRelatedSymbols as newsRelatedSymbolsSchema } from "../db/schema/newsRelatedSymbols.js"

import { eq } from "drizzle-orm"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

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

    return news
}

async function saveNews() {

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

        if (exists.length > 0) continue

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

        if (!news.relatedSymbols || news.relatedSymbols.length === 0) continue

        for (const symbol of news.relatedSymbols) {
            await db
                .insert(newsRelatedSymbolsSchema)
                .values({
                    newsId: news.id,
                    symbol: symbol.symbol,
                    logoid: symbol.logoid
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

async function main() {
    startServer()

    await saveNews()

    const INTERVAL = 1000 * 60 * 30

    setInterval(async () => {
        console.log("Fetching news")

        await saveNews()
    }, INTERVAL)
}

main()