import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import {
	type User,
	watchList as watchListSchema,
	watchListSymbols as watchListSymbolsSchema
} from "../../db/schema/users.js"
import { eq } from "drizzle-orm"

async function getWatchlistByUser(user: User) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const wallet = await db.select().from(watchListSchema).where(eq(watchListSchema.userId, user.id))

	return wallet
}

async function getWatchlistById({ id }: { id: string }) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const wallet = await db.select().from(watchListSchema).where(eq(watchListSchema.listId, id))

	const walletSymbols = await db.select().from(watchListSymbolsSchema).where(eq(watchListSymbolsSchema.listId, id))

	return {
		wallet,
		walletSymbols: walletSymbols || []
	}
}

export default getWatchlistById
export { getWatchlistById, getWatchlistByUser }
