import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { newsArticleSchema, newsRelatedSymbolsSchema, newsSchema } from "./schema/news.js"
import { eq } from "drizzle-orm"
import { getNewsImportanceScore } from "../web/utils/news.js"

// node --loader ts-node/esm ./db/importanceNews.ts

async function importanceNews() {
	const sqlite = new Database("./db/sqlite.db")
	const db = drizzle(sqlite)

	const news = await db.select().from(newsSchema)

	for (const n of news) {
		const article = await db.select().from(newsArticleSchema).where(eq(newsArticleSchema.newsId, n.id))

		const relatedSymbols = await db
			.select()
			.from(newsRelatedSymbolsSchema)
			.where(eq(newsRelatedSymbolsSchema.newsId, n.id))

		if (article.length === 0) {
			continue
		}

		const importance = getNewsImportanceScore(n.title, article[0].jsonDescription, relatedSymbols)

		await db
			.update(newsSchema)
			.set({
				importanceScore: importance
			})
			.where(eq(newsSchema.id, n.id))
	}
}

importanceNews()
