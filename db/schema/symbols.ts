import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const symbolsSchema = sqliteTable("symbol", {
	symbolId: text("id").primaryKey().unique(),
	lastUpdate: text("last_update")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	logoid: text("logoid"),
	high1M: int("high_1m"),
	low1M: int("low_1m"),
	perf1M: int("perf_1m"),
	perf3M: int("perf_3m"),
	perf6M: int("perf_6m"),
	perfW: int("perf_w"),
	perfY: int("perf_y"),
	// biome-ignore lint/style/useNamingConvention: API field names
	perfYTD: int("perf_ytd"),
	recommendAll: int("recommend_all"),
	averageVolume10dCalc: int("average_volume_10d_calc"),
	averageVolume30dCalc: int("average_volume_30d_calc"),
	country: text("country"),
	countryCodeFund: text("country_code_fund"),
	market: text("market"),
	price52WeekHigh: int("price_52_week_high"),
	price52WeekLow: int("price_52_week_low"),
	sector: text("sector"),
	name: text("name"),
	description: text("description")
})

// export type NewsRelatedSymbol = typeof newsRelatedSymbols.$inferSelect
export type Symbol = typeof symbolsSchema.$inferSelect
