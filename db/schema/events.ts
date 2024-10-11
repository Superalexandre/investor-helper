import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const events = sqliteTable("events", {
	id: text("id").primaryKey().unique(),
	title: text("title").notNull(),
	country: text("country").notNull(),
	indicator: text("indicator").notNull(),
	ticker: text("ticker"),
	comment: text("comment"),
	category: text("category"),
	period: text("period"),
	referenceDate: text("reference_date"),
	source: text("source"),
	sourceUrl: text("source_url"),
	actual: int("actual"),
	previous: int("previous"),
	forecast: int("forecast"),
	actualRaw: int("actual_raw"),
	previousRaw: int("previous_raw"),
	forecastRaw: int("forecast_raw"),
	currency: text("currency").notNull(),
	unit: text("unit"),
	scale: text("scale"),
	importance: int("importance").notNull(),
	date: text("date").notNull()
})

export type Events = typeof events.$inferSelect
