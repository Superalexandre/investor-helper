import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import fs from "node:fs"

function migrateDatabase() {
	console.log("\nMigrating database...")

	// Check if the database file exists
	if (!fs.existsSync("./db/sqlite.db")) {
		fs.writeFileSync("./db/sqlite.db", "")
	}

	const sqlite = new Database("./db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	migrate(db, { migrationsFolder: "./db/migrations" })

	sqlite.close()

	console.log("\nDatabase migrated")

	return true
}

migrateDatabase()
