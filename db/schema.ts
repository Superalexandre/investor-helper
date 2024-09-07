import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { createId } from "@paralleldrive/cuid2"

export const users = sqliteTable("user", {
    id: text("id")
        .primaryKey()
        .unique()
        .$defaultFn(() => createId()),
    firstName: text("first_name")
        .notNull(),
    lastName: text("last_name")
        .notNull(),
    email: text("email")
        .unique(),
    password: text("password")
        .notNull(),
    createdAt: text("created_at")
        .notNull(),
    updatedAt: text("updated_at")
        .notNull(),
})

export type User = typeof users.$inferSelect

// export const calendarTokens = sqliteTable("calendar_token", {
//     token: text("token").primaryKey().unique(),
//     userId: text("user_id").references(() => users.id),
//     createdAt: text("created_at"),
//     updatedAt: text("updated_at"),
// })