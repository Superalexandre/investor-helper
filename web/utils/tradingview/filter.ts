import { z } from "zod"

const ColumnSchema = z.enum([
	"symbol",
	"name",
	"description",
	"logoid",
	"update_mode",
	"type",
	"typespecs",
	"close",
	"pricescale",
	"minmov",
	"fractional",
	"minmove2",
	"currency",
	"change",
	"volume",
	"relative_volume_10d_calc",
	"market_cap_basic",
	"fundamental_currency_code",
	"price_earnings_ttm",
	"earnings_per_share_diluted_ttm",
	"earnings_per_share_diluted_yoy_growth_ttm",
	"dividends_yield_current",
	"sector.tr",
	"market",
	"sector",
	"recommendation_mark",
	"exchange",
	"enterprise_value_current",
	"country.tr",
	"country_code_fund",
	"float_shares_percent_current"
])

const ColumnResultSchema = z.object({
    name: z.string().optional(),
    symbol: z.string().optional(),
    description: z.string().nullable().optional(),
    logoid: z.string().nullable().optional(),
    update_mode: z.string().optional(),
    type: z.string().optional(),
    typespecs: z.array(z.string()).optional(),
    close: z.number().optional(),
    pricescale: z.number().optional(),
    minmov: z.number().optional(),
    fractional: z.boolean().optional(),
    minmove2: z.number().optional(),
    currency: z.string().optional(),
    change: z.number().optional(),
    volume: z.number().optional(),
    relative_volume_10d_calc: z.number().optional(),
    market_cap_basic: z.number().optional(),
    fundamental_currency_code: z.string().optional(),
    price_earnings_ttm: z.number().optional(),
    earnings_per_share_diluted_ttm: z.number().optional(),
    earnings_per_shares_diluted_yoy_growth_ttm: z.number().optional(),
    dividends_yield_current: z.number().optional(),
    'sector.tr': z.string().optional(),
    market: z.string().optional(),
    sector: z.string().optional(),
    recommendation_mark: z.number().optional(),
    exchange: z.string().optional(),
    enterprise_value_current: z.number().optional(),
    'country.tr': z.string().optional(),
    country_code_fund: z.string().optional(),
    float_shares_percent_current: z.number().optional()
})

type ColumnType = z.infer<typeof ColumnSchema>
type ColumnsArray = ColumnType[]

type ColumnResultType = z.infer<typeof ColumnResultSchema>

// Define supported filter operations
const FilterOperationSchema = z.enum(["and", "or"])
type FilterOperationType = z.infer<typeof FilterOperationSchema>

type FilterFieldType = z.infer<typeof ColumnSchema>

// Define supported operations for expressions
const ExpressionOperationSchema = z.enum(["equal", "greater", "has", "has_none_of"])
type ExpressionOperationType = z.infer<typeof ExpressionOperationSchema>

// Define FilterExpression schema
const FilterExpressionSchema = z.object({
    expression: z.object({
        left: ColumnSchema,
        operation: ExpressionOperationSchema,
        right: z.any()
    })
})

type FilterExpression = z.infer<typeof FilterExpressionSchema>

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const FilterOperationSchemaNested: z.ZodType<any> = z.object({
	operation: z.object({
		operator: FilterOperationSchema,
		operands: z.array(
			z.union([
				FilterExpressionSchema,
				z.lazy(() => FilterOperationSchemaNested)
			])
		)
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
	ColumnSchema,
	ColumnResultSchema,
	FilterOperationSchema,
	ExpressionOperationSchema,
	FilterExpressionSchema,
	FilterOperationSchemaNested,
	SortBySchema,
	SortOrderSchema,
	MarketsSchema,
	LangSchema,
	createFilterExpression,
	and,
	or
}

export type {
	ColumnType,
	ColumnsArray,
	ColumnResultType,
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
