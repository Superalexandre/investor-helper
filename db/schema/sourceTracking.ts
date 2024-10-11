import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { v4 as uuid } from "uuid"

export const sourceTracking = sqliteTable("source_tracking", {
	id: text("id")
		.primaryKey()
		.unique()
		.$defaultFn(() => {
			return uuid()
		}),
	type: text("type", {
		mode: "text",
		enum: ["utm", "ref", "direct", "email", "social", "other"]
	}).notNull(),
	source: text("source").notNull(),
	fullUrl: text("full_url").notNull(),
	isLogged: int("as_account", {
		mode: "boolean"
	}).notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
})

export type SourceTracking = typeof sourceTracking.$inferSelect
