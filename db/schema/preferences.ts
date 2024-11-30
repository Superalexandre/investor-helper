import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { usersSchema } from "./users.js"

export const usersPreferencesSchema = sqliteTable("usersPreference", {
	userId: text("user_id")
        .references(() => usersSchema.id)
        .notNull(),
    theme: text("theme")
        .notNull()
        .default("light"),
    language: text("language")
        .notNull()
        .default("fr-FR"),
})

export type UserPreference = typeof usersPreferencesSchema.$inferSelect
