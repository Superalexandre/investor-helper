import { z } from "zod"

const ColumnGlobalMapping = {} as const

const ColumnScreenerMapping = {
	...ColumnGlobalMapping,

	symbol: z.string(),
	name: z.string(),
	description: z.string(),
	logoid: z.string(),
	update_mode: z.string(),
	type: z.string(),
	typespecs: z.string(),
	close: z.number(),
	pricescale: z.number(),
	minmov: z.number(),
	fractional: z.boolean(),
	minmove2: z.number(),
	currency: z.string(),
	change: z.number(),
	volume: z.number(),
	relative_volume_10d_calc: z.number(),
	market_cap_basic: z.number(),
	fundamental_currency_code: z.string(),
	price_earnings_ttm: z.number(),
	earnings_per_share_diluted_ttm: z.number(),
	earnings_per_share_diluted_yoy_growth_ttm: z.number(),
	dividends_yield_current: z.number(),
	"sector.tr": z.string(),
	market: z.string(),
	sector: z.string(),
	recommendation_mark: z.number(),
	exchange: z.string(),
	enterprise_value_current: z.number(),
	"country.tr": z.string(),
	country_code_fund: z.string(),
	float_shares_percent_current: z.number()
} as const

const ColumnStockMapping = {
	...ColumnGlobalMapping,
	change: z.number(),
	"High.1M": z.number(),
	"Low.1M": z.number(),
	"Perf.1M": z.number(),
	"Perf.3M": z.number(),
	"Perf.6M": z.number(),
	"Perf.W": z.number(),
	"Perf.Y": z.number(),
	"Perf.YTD": z.number(),
	"Recommend.All": z.number(),
	average_volume_10d_calc: z.number(),
	average_volume_30d_calc: z.number(),
	country: z.string(),
	country_code_fund: z.string(),
	market: z.string(),
	nav_discount_premium: z.number(),
	open_interest: z.number(),
	price_52_week_high: z.number(),
	price_52_week_low: z.number(),
	sector: z.string(),
	logoid: z.string(),
	name: z.string(),
	description: z.string(),
	base_currency_logoid: z.string(),
	currency: z.string(),
	exchange: z.string(),
	isin: z.string(),
	type: z.string(),
	close: z.number(),
	ticker: z.string(),
	"sector.tr": z.string(),
	"country.tr": z.string(),
	market_cap_basic: z.number(),
	recommend_signal: z.string(),
	industry: z.string(),
	"industry.tr": z.string(),
	"Recommend.All|1W": z.number(),
	"Pivot.M.Fibonacci.S3": z.number(),
	"Pivot.M.Fibonacci.S2": z.number(),
	"Pivot.M.Fibonacci.S1": z.number(),
	"Pivot.M.Fibonacci.Middle": z.number(),
	"Pivot.M.Fibonacci.R1": z.number(),
	"Pivot.M.Fibonacci.R2": z.number(),
	"Pivot.M.Fibonacci.R3": z.number(),
	"pro_symbol": z.string(),
} as const

const ColumnScreenerSchema = z.enum(
	Object.keys(ColumnScreenerMapping) as [
		keyof typeof ColumnScreenerMapping,
		...Array<keyof typeof ColumnScreenerMapping>
	]
)

const ColumnStockSchema = z.enum(
	Object.keys(ColumnStockMapping) as [keyof typeof ColumnStockMapping, ...Array<keyof typeof ColumnStockMapping>]
)

type ColumnTypeScreener = z.infer<typeof ColumnScreenerSchema>
type ColumnsArrayScreener = ColumnTypeScreener[]

type ColumnTypeStock = z.infer<typeof ColumnStockSchema>
type ColumnsArrayStock = ColumnTypeStock[]

type ColumnScreenerMappingType = {
	[Key in ColumnTypeScreener]: z.infer<(typeof ColumnScreenerMapping)[Key]>
}

type ColumnStockMappingType = {
	[Key in ColumnTypeStock]: z.infer<(typeof ColumnStockMapping)[Key]>
}

// Define supported filter operations
const FilterOperationSchema = z.enum(["and", "or"])
type FilterOperationType = z.infer<typeof FilterOperationSchema>

// Add is_blacklisted to the list of supported columns
type FilterFieldType = z.infer<typeof ColumnScreenerSchema> | z.infer<typeof ColumnStockSchema>

// Define supported operations for expressions
const ExpressionOperationSchema = z.enum(["equal", "greater", "has", "has_none_of", "not_in_range"])
type ExpressionOperationType = z.infer<typeof ExpressionOperationSchema>

// Define FilterExpression schema
const FilterExpressionSchema = z.object({
	expression: z.object({
		left: z.union([ColumnScreenerSchema, ColumnStockSchema]),
		operation: ExpressionOperationSchema,
		right: z.any()
	})
})

type FilterExpression = z.infer<typeof FilterExpressionSchema>

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const FilterOperationSchemaNested: z.ZodType<any> = z.object({
	operation: z.object({
		operator: FilterOperationSchema,
		operands: z.array(z.union([FilterExpressionSchema, z.lazy(() => FilterOperationSchemaNested)]))
	})
})
type FilterOperation = z.infer<typeof FilterOperationSchemaNested>

// Supported `sortBy` values
const SortBySchema = z.enum(["change", "volume", "market_cap_basic"])
type SortByType = z.infer<typeof SortBySchema>

const SortOrderSchema = z.enum(["asc", "desc"])
type SortOrderType = z.infer<typeof SortOrderSchema>

// Supported `markets` values
const MarketsSchema = z.array(z.string())
type MarketsType = z.infer<typeof MarketsSchema>

// Supported `lang` values
const LangSchema = z.enum(["fr", "en"])
type LangType = z.infer<typeof LangSchema>

/*
{
	left: "market_cap_basic",
	operation: "nempty"
}
*/

const createFilterOperation = <T extends FilterFieldType>(
	left: T,
	operation: "nempty",
) => {
	return {
		expression: {
			left,
			operation,
		}
	}
}

// Helper function to create filter expressions dynamically
const createFilterExpression = <T extends FilterFieldType>(
	left: T,
	operation: ExpressionOperationType,
	right: T extends "typespecs" ? string[] : unknown
): FilterExpression => {
	return {
		expression: {
			left,
			operation,
			right
		}
	}
}

// Define logical operators
const and = (...operands: (FilterExpression | FilterOperation)[]): FilterOperation => ({
	operation: {
		operator: "and",
		operands: operands.map((operand) => ("expression" in operand ? { expression: operand.expression } : operand))
	}
})

const or = (...operands: (FilterExpression | FilterOperation)[]): FilterOperation => ({
	operation: {
		operator: "or",
		operands: operands.map((operand) => ("expression" in operand ? { expression: operand.expression } : operand))
	}
})

export {
	ColumnScreenerSchema,
	ColumnStockSchema,
	ColumnScreenerMapping,
	ColumnStockMapping,
	FilterOperationSchema,
	ExpressionOperationSchema,
	FilterExpressionSchema,
	FilterOperationSchemaNested,
	SortBySchema,
	SortOrderSchema,
	MarketsSchema,
	LangSchema,
	createFilterExpression,
	createFilterOperation,
	and,
	or
}

export type {
	ColumnTypeScreener,
	ColumnsArrayScreener,
	ColumnTypeStock,
	ColumnsArrayStock,
	ColumnScreenerMappingType,
	ColumnStockMappingType,
	FilterOperationType,
	FilterFieldType,
	ExpressionOperationType,
	FilterExpression,
	FilterOperation,
	SortByType,
	SortOrderType,
	MarketsType,
	LangType
}
