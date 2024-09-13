import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { news as newsSchema, newsRelatedSymbols as newsRelatedSymbolsSchema } from "../../db/schema/news.js"
import type { News, NewsRelatedSymbol } from "../../db/schema/news.js"
import { desc, eq } from "drizzle-orm"
// import { fileURLToPath } from "url"
// import { dirname, join } from "path"

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

async function getNews({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    // const sqlite = new Database(join(__dirname, "..", "..", "db", "sqlite.db"))
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    // Get the news from the database
    const news = await db
        .select()
        .from(newsSchema)
        .limit(limit)
        .offset(limit * (page - 1))
        .orderBy(desc(newsSchema.published))
        .leftJoin(newsRelatedSymbolsSchema, eq(newsSchema.id, newsRelatedSymbolsSchema.newsId))

    const groupedNews = group(news)

    return groupedNews
}

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

export default getNews
export {
    getNews
}
export type {
    News,
    NewsRelatedSymbol
}