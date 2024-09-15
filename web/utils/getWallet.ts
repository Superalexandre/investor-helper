import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { wallet as walletSchema, walletSymbols as walletSymbolsSchema } from "../../db/schema/users.js"
import { eq } from "drizzle-orm"

async function getWalletById({ id }: { id: string }) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const wallet = await db
        .select()
        .from(walletSchema)
        .where(eq(walletSchema.walletId, id))

    const walletSymbols = await db
        .select()
        .from(walletSymbolsSchema)
        .where(eq(walletSymbolsSchema.walletId, id))

    return {
        wallet,
        walletSymbols: walletSymbols || []
    }
}

export default getWalletById
export {
    getWalletById
}