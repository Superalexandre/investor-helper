import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { users as usersSchema, wallet as walletSchema, watchList as watchListSchema } from "../../db/schema/users.js"
import { eq } from "drizzle-orm"
// import { fileURLToPath } from "url"
// import { dirname, join } from "path"

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

async function getUser({ id }: { id: string }) {
    // const sqlite = new Database(join(__dirname, "..", "..", "db", "sqlite.db"))
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    // Get the news from the database
    const user = await db
        .select({
            id: usersSchema.id,
            firstName: usersSchema.firstName,
            lastName: usersSchema.lastName,
            email: usersSchema.email,
            createdAt: usersSchema.createdAt,
            updatedAt: usersSchema.updatedAt
        })
        .from(usersSchema)
        .where(eq(usersSchema.id, id))

    const userWallet = await db
        .select()
        .from(walletSchema)
        .where(eq(walletSchema.userId, id))

    const userWatchList = await db
        .select()
        .from(watchListSchema)
        .where(eq(watchListSchema.userId, id))

    return {
        user: user[0],
        wallet: userWallet,
        watchList: userWatchList
    }
}

export default getUser
export {
    getUser
}