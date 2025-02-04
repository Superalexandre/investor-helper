import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { type User, walletSchema, walletSymbolsSchema } from "../../db/schema/users.js"
import { eq } from "drizzle-orm"

async function getWalletByUser(user: User) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const wallet = await db.select().from(walletSchema).where(eq(walletSchema.userId, user.id))

	return wallet
}

async function getWalletById({ id }: { id: string }) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const walletResults = await db.select().from(walletSchema).where(eq(walletSchema.walletId, id))

	if (!walletResults || walletResults.length === 0 || !walletResults[0]) {
		return null
	}

	const wallet = walletResults[0]

	const walletSymbols = await db
		.select()
		.from(walletSymbolsSchema)
		.where(eq(walletSymbolsSchema.walletId, wallet.walletId))

	return {
		wallet,
		walletSymbols: walletSymbols || []
	}
}

export default getWalletById
export { getWalletById, getWalletByUser }
