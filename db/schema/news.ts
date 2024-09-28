import { relations } from "drizzle-orm"
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { symbols } from "./symbols.js"

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
    mainSource: text("main_source")
        .notNull()
        .default("tradingview"),
    lang: text("lang")
        .notNull()
        .default("fr-FR"),
    importanceScore: int("importance_score")
        .notNull()
        .default(0),
})

export type News = typeof news.$inferSelect

export const newsRelatedSymbols = sqliteTable("news_related_symbol", {
    newsId: text("news_id").references(() => news.id),
    symbol: text("symbol").references(() => symbols.symbolId),
})

export const newsRelation = relations(news, ({ many }) => ({
    relatedSymbols: many(newsRelatedSymbols)
}))

export type NewsRelatedSymbol = typeof newsRelatedSymbols.$inferSelect

export const newsArticle = sqliteTable("news_article", {
    newsId: text("news_id").references(() => news.id),
    date: int("date"),
    // htmlDescription: text("html_description")
    //     .notNull(),
    // textDescription: text("text_description")
    //     .notNull(),
    jsonDescription: text("json_description")
        .notNull(),
    shortDescription: text("short_description"),
    copyright: text("copyright"),
})

export type NewsArticle = typeof newsArticle.$inferSelect