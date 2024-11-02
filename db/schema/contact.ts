import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const contactSchema = sqliteTable("contact", {
	id: text("id").primaryKey().unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull()
})

export type Contact = typeof contactSchema.$inferSelect
