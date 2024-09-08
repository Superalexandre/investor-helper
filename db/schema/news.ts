import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

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
})

export type News = typeof news.$inferSelect
