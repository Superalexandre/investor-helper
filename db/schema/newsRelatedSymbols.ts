import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { news } from "./news"
import { relations } from "drizzle-orm"

export const newsRelatedSymbols = sqliteTable("news_related_symbol", {
    newsId: text("news_id").references(() => news.id),
    symbol: text("symbol")
        .notNull(),
    logoid: text("logoid"),
})

export const newsRelation = relations(news, ({ many }) => ({
    relatedSymbols: many(newsRelatedSymbols)
}))

export type NewsRelatedSymbol = typeof newsRelatedSymbols.$inferSelect