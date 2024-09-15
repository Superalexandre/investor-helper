import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { news as newsSchema, newsRelatedSymbols as newsRelatedSymbolsSchema, newsArticle as newsArticleSchema } from "../../db/schema/news.js"
import { Symbol, symbols as symbolsSchema } from "../../db/schema/symbols.js"
import type { News, NewsArticle } from "../../db/schema/news.js"
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
        .innerJoin(symbolsSchema, eq(newsRelatedSymbolsSchema.symbol, symbolsSchema.symbolId))

    const groupedNews = group(news as FullNews[])

    return groupedNews
}

async function getNewsById({ id }: { id: string }) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    // Get the news from the database
    const news = await db
        .select()
        .from(newsSchema)
        .where(eq(newsSchema.id, id))
        .leftJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
        .leftJoin(newsRelatedSymbolsSchema, eq(newsSchema.id, newsRelatedSymbolsSchema.newsId))
        .leftJoin(symbolsSchema, eq(newsRelatedSymbolsSchema.symbol, symbolsSchema.symbolId))

    const groupedNews: GroupedNews<NewsArticle>[] = group(news as FullNews<NewsArticle>[])

    return groupedNews
}

interface FullNews<T = News> {
    news: News;
    news_article?: T extends NewsArticle ? T : null;
    news_related_symbol: Symbol[] | null;
    symbol: Symbol;
}

interface GroupedNews<T = News> {
    news: News;
    newsArticle: T extends NewsArticle ? T : null;
    relatedSymbols: (Symbol | null)[] | null;
}

function group<T = News>(news: FullNews<T>[]): GroupedNews<T>[] {
    return news.reduce((acc: GroupedNews<T>[], curr: FullNews<T>) => {
        const existingNews = acc.find(item => item.news.id === curr.news.id)

        if (existingNews && curr.news_related_symbol !== null && existingNews.relatedSymbols !== null) {
            existingNews.relatedSymbols.push({...curr.news_related_symbol, ...curr.symbol})
        } else {
            acc.push({
                news: curr.news,
                newsArticle: curr.news_article as T extends NewsArticle ? T : null,
                relatedSymbols: curr.news_related_symbol !== null ? [{...curr.news_related_symbol, ...curr.symbol}] : []
            })
        }

        return acc
    }, [])
}

export default getNews
export {
    getNews,
    getNewsById
}
export type {
    News,
    FullNews,
    GroupedNews,
}