import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"
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

export const news = sqliteTable("news", {
    id: text("id")
        .primaryKey()
        .unique(),
    title: text("title")
        .notNull(),
    storyPath: text("story_path")
        .notNull(),
    sourceLogoId: text("source_logo_id")
        .notNull(),
    published: int("published")
        .notNull(),
    source: text("source")
        .notNull(),
    urgency: int("urgency")
        .notNull(),
    provider: text("provider")
        .notNull(),
    link: text("link"),
    /*
    "relatedSymbols": [
        {
            "symbol": "NYSE:DIS",
            "logoid": "walt-disney"
        }
    ]
    */
    // Array of objects

})