import { z } from "zod"
import {
	type ColumnsArrayScreener,
	type ColumnTypeScreener,
	type ColumnScreenerMappingType,
	ColumnScreenerSchema,
	FilterOperationSchemaNested,
	LangSchema,
	MarketsSchema,
	SortBySchema,
	SortOrderSchema,
	ColumnStockSchema,
	type ColumnsArrayStock,
	type ColumnStockMappingType,
	type ColumnTypeStock,
	ColumnStockMapping
} from "./filter"

type TradingViewDataItemDynamic<TColumns extends readonly ColumnTypeScreener[] | readonly ColumnTypeStock[]> = {
	s: string // Symbol with exchange
	d: { [K in TColumns[number]]: unknown } // Map each column to its type
}

interface TradingViewResponseDynamic<TColumns extends ColumnsArrayScreener | ColumnsArrayStock> {
	totalCount: number
	data: TradingViewDataItemDynamic<TColumns>[] // Dynamically typed based on TColumns
}

// This function will need to adapt to the two possibilities (Screener or Stock)
function parseTradingViewResponse<
	TColumns extends ColumnsArrayScreener | ColumnsArrayStock,
	TMapping extends ColumnScreenerMappingType | ColumnStockMappingType
>(
	columns: TColumns | null,
	response: TradingViewResponseDynamic<TColumns>
): { [K in TColumns[number]]: TMapping[K & keyof TMapping] }[] {
	if (!columns) {
		return []
	}

	return response.data.map((item) => {
		const reduced = columns.reduce(
			(acc, column, index) => {
				// @ts-ignore
				acc[column] = item.d[index] as TMapping[typeof column]
				return acc
			},
			{} as { [K in TColumns[number]]: TMapping[K & keyof TMapping] } & { symbol: string }
		)

		reduced.symbol = item.s

		return reduced
	})
}
// Request structure
const TradingViewRequestSchema = z.object({
	columns: z.array(ColumnScreenerSchema),
	filter2: FilterOperationSchemaNested.optional(),
	// biome-ignore lint/style/useNamingConvention: <explanation>
	ignore_unknown_fields: z.boolean().optional(),
	options: z.object({
		lang: LangSchema
	}),
	range: z.tuple([z.number(), z.number()]),
	sort: z.object({
		sortBy: SortBySchema,
		sortOrder: SortOrderSchema
	}),
	symbols: z.record(z.unknown()).optional(),
	markets: MarketsSchema.optional()
})
type TradingViewRequest = z.infer<typeof TradingViewRequestSchema>

const FetchScreenerParamsSchema = z.object({
	country: z.string(),
	columns: z.array(ColumnScreenerSchema),
	filter: FilterOperationSchemaNested.optional(),
	range: z.tuple([z.number(), z.number()]).optional(),
	options: z
		.object({
			lang: LangSchema
		})
		.optional(),
	sort: z
		.object({
			sortBy: SortBySchema,
			sortOrder: SortOrderSchema
		})
		.optional(),
	symbols: z.record(z.unknown()).optional(),
	markets: MarketsSchema.optional()
})
type FetchParams = z.infer<typeof FetchScreenerParamsSchema>

// biome-ignore lint/style/useNamingConvention: <explanation>
const fetchScreener = async <TColumns extends ColumnsArrayScreener>({
	country,
	columns,
	filter,
	range,
	sort,
	symbols,
	options
}: FetchParams): Promise<{
	success: boolean
	message: string
	result: TradingViewResponseDynamic<TColumns> | null
	parsedResult: { [K in TColumns[number]]: ColumnScreenerMappingType[K] }[] | null
}> => {
	const url = `https://scanner.tradingview.com/${country}/scan?label-product=screener-stock`

	const requestBody: TradingViewRequest = {
		columns,
		filter2: filter,
		options: {
			lang: "en",
			...options
		},
		range: range || [0, 100],
		sort: sort ?? {
			sortBy: "change",
			sortOrder: "asc"
		},
		// biome-ignore lint/style/useNamingConvention: <explanation>
		ignore_unknown_fields: true,
		markets: [country],
		symbols: symbols || {}
	}

	const response = await fetch(url, {
		method: "POST",
		body: JSON.stringify(requestBody),
		headers: { "Content-Type": "application/json" }
	})

	if (!response.ok) {
		return {
			success: false,
			message: response.statusText,
			result: null,
			parsedResult: null
		}
	}

	const result: TradingViewResponseDynamic<TColumns> = await response.json()
	const parsed = parseTradingViewResponse(columns as TColumns, result as TradingViewResponseDynamic<TColumns>)

	return {
		success: true,
		message: "Data fetched successfully",
		result,
		parsedResult: parsed as { [K in TColumns[number]]: ColumnScreenerMappingType[K] }[]
	}
}

const FetchSymbolParamsSchema = z.object({
	symbol: z.string(),
	// Fields is "all" or a list of columns
	fields: z.union([z.literal("all"), z.array(ColumnStockSchema)])
})
type FetchSymbolParams = z.infer<typeof FetchSymbolParamsSchema>

const fetchSymbol = async <TColumns extends ColumnsArrayStock>({
	symbol,
	fields
}: FetchSymbolParams): Promise<{
	success: boolean
	message: string
	result: TradingViewResponseDynamic<TColumns> | null
	parsedResult: { [K in TColumns[number]]: ColumnStockMappingType[K] }[] | null
}> => {

	if (fields === "all") {
		fields = Object.keys(ColumnStockMapping) as TColumns
	}

	const url = `https://scanner.tradingview.com/symbol?symbol=${symbol}&fields=${fields}&no_404=true`

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json"
		}
	})

	if (!response.ok) {
		return {
			success: false,
			message: response.statusText,
			result: null,
			parsedResult: null
		}
	}

	const result: TradingViewResponseDynamic<TColumns> = await response.json()

	// Parse the response based on stock column types
	const parsed = parseTradingViewResponse(fields as TColumns, result as TradingViewResponseDynamic<TColumns>)

	return {
		success: true,
		message: "Data fetched successfully",
		result,
		parsedResult: parsed as { [K in TColumns[number]]: ColumnStockMappingType[K] }[]
	}
}

export { fetchScreener, fetchSymbol }
