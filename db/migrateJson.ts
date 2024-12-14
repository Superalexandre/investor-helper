// biome-ignore lint/suspicious/useAwait: <explanation>

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { newsArticleSchema } from "./schema/news"
import zlib from "node:zlib"
import { eq } from "drizzle-orm"
import fs from "node:fs"

function prettySize(size: number) {
	const i = Math.floor(Math.log(size) / Math.log(1024))
	return `${(size / 1024 ** i).toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][i]}`
}

// biome-ignore lint/nursery/useExplicitType: <explanation>
async function main() {
	// Get in the database the biggest JSON
	// And compare them

	const sqlite = new Database("./db/sqlite.db")
	const db = drizzle(sqlite)

	const news = await db.select().from(newsArticleSchema)

	// Get the sqlite database size
	const stats = fs.statSync("./db/sqlite.db")

	console.log(`Database size: ${prettySize(stats.size)}`)

	let i = 0
	const startTimestamp = Date.now()
	// for (const article of news) {
	// 	if (!article || !article.jsonDescription || !article.newsId) {
	// 		continue
	// 	}

	// 	const compressed = zlib.deflateSync(article.jsonDescription)
	// 	const compressedToString = compressed.toString("base64")

	// 	await db
	// 		.update(newsArticleSchema)
	// 		.set({ jsonDescription: compressedToString })
	// 		.where(eq(newsArticleSchema.newsId, article.newsId))

	// 	i++

	// 	console.log(`Updated ${i}/${news.length} articles`)
	// }

	await Promise.all(
		news.map((article) => {
			if (!article || !article.jsonDescription || !article.newsId) {
				return
			}

			const compressed = zlib.deflateSync(article.jsonDescription).toString()

			return db.update(newsArticleSchema)
				.set({ jsonDescription: compressedToString })
				.where(eq(newsArticleSchema.newsId, article.newsId))
		})
	)

	const statsAfter = fs.statSync("./db/sqlite.db")
	const endTimestamp = Date.now()

	console.log(
		`Took ${endTimestamp - startTimestamp}ms to compress ${news.length} articles from ${prettySize(stats.size)} to ${prettySize(statsAfter.size)}`
	)
}

main()
