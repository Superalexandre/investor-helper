import { Hono } from "hono"
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { News, news as newsSchema } from "../../db/schema/news.js"
import { desc, eq } from "drizzle-orm"
import { NewsRelatedSymbol, newsRelatedSymbols as newsRelatedSymbolsSchema } from "../../db/schema/newsRelatedSymbols.js"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const newsHono = new Hono()

newsHono.get("/", async (req) => {
    const sqlite = new Database(join(__dirname, "..", "..", "db", "sqlite.db"))
    const db = drizzle(sqlite)

    // Get params from the request
    const { limit, page } = req.req.query()

    const limitReq = limit ? parseInt(limit) : 10
    const pageReq = page ? parseInt(page) : 1

    // Get the news from the database
    const news = await db
        .select()
        .from(newsSchema)
        .limit(limitReq)
        .offset(limitReq * (pageReq - 1))
        .orderBy(desc(newsSchema.published))
        .leftJoin(newsRelatedSymbolsSchema, eq(newsSchema.id, newsRelatedSymbolsSchema.newsId))

    const groupedNews = group(news)

    return req.json(groupedNews)
})

interface FullNews {
    news: News;
    news_related_symbol: NewsRelatedSymbol | null;
}

interface GroupedNews {
    news: News;
    relatedSymbols: (NewsRelatedSymbol | null)[] | null;
}

function group(news: FullNews[]) {
    return news.reduce((acc: GroupedNews[], curr: FullNews) => {
        const existingNews = acc.find(item => item.news.id === curr.news.id)

        if (existingNews && curr.news_related_symbol !== null && existingNews.relatedSymbols !== null) {
            existingNews.relatedSymbols.push(curr.news_related_symbol)
        } else {
            acc.push({
                news: curr.news,                
                relatedSymbols: curr.news_related_symbol !== null ? [curr.news_related_symbol] : null
            })
        }

        return acc
    }, [])
}

export default newsHono