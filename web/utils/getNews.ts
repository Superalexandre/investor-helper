import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { news as newsSchema, newsRelatedSymbols as newsRelatedSymbolsSchema, newsArticle as newsArticleSchema } from "../../db/schema/news.js"
import { symbols as symbolsSchema } from "../../db/schema/symbols.js"
import { desc, eq } from "drizzle-orm"

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
    getNewsById
}
export type {
    // News,
    // FullNews,
    // GroupedNews,
}