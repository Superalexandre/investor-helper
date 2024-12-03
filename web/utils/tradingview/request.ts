import { z } from "zod"
import {
	ColumnResultType,
	type ColumnsArray,
	ColumnSchema,
	type ColumnType,
	type FilterOperation,
	FilterOperationSchemaNested,
	LangSchema,
	MarketsSchema,
	SortBySchema,
	SortOrderSchema
} from "./filter"

// biome-ignore lint/style/useNamingConvention: <explanation>
type TradingViewDataItemDynamic<TColumns extends readonly ColumnType[]> = {
	s: string // Symbol with exchange
	d: { [K in TColumns[number]]: unknown } // Map each column to its type
}

// biome-ignore lint/style/useNamingConvention: <explanation>
interface TradingViewResponseDynamic<TColumns extends ColumnsArray> {
	totalCount: number
	data: TradingViewDataItemDynamic<TColumns>[]
}

// biome-ignore lint/style/useNamingConvention: <explanation>
function parseTradingViewResponse<TColumns extends ColumnType[]>(
	columns: TColumns,
	response: TradingViewResponseDynamic<TColumns>
): Record<TColumns[number], unknown>[] {
	return response.data.map((item) => {
		const reduced = columns.reduce(
			(acc, column, index) => {
				// @ts-expect-error: TS doesn't know that column is a valid key of item
				acc[column] = item.d[index]
				return acc
			},
			{} as Record<TColumns[number], unknown> & { symbol: string }
		)

		reduced.symbol = item.s

		return reduced
	})
}

// Request structure
const TradingViewRequestSchema = z.object({
	columns: z.array(ColumnSchema),
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

const FetchParamsSchema = z.object({
	country: z.string(),
	columns: z.array(ColumnSchema),
	filter: FilterOperationSchemaNested.optional(),
	range: z.tuple([z.number(), z.number()]).optional(),
	options: z.object({
		lang: LangSchema
	}).optional(),
	sort: z
		.object({
			sortBy: SortBySchema,
			sortOrder: SortOrderSchema
		})
		.optional(),
	symbols: z.record(z.unknown()).optional(),
	markets: MarketsSchema.optional()
})
type FetchParams = z.infer<typeof FetchParamsSchema>

// biome-ignore lint/style/useNamingConvention: <explanation>
const fetchData = async <TColumns extends ColumnsArray>({
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
	parsedResult: Record<TColumns[number], unknown>[] | null
}> => {
	const url = `https://scanner.tradingview.com/${country}/scan?label-product=screener-stock`

	/*
    columns,
			filter2: filter,
			// biome-ignore lint/style/useNamingConvention: <explanation>
			ignore_unknown_fields: false,
			options: {
				lang: "fr"
			},
			range: [0, 20],
			sort: {
				sortBy: "change",
				sortOrder: "asc"
			},
			symbols: {},
			markets: [country]
            */

	console.log(sort)

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
	const parsed = parseTradingViewResponse(columns, result)

	return {
		success: true,
		message: "Data fetched successfully",
		result,
		parsedResult: parsed
	}
}

export { fetchData }

/*
const _fetchExample = async () => {
    const filter = and(
        createFilterExpression("change", "greater", 0),
    )

    const { parsed } = await fetchDynamicData({
		country: "US",
		columns: ["change", "close", "currency"]
	})

	console.log(parsed[0])
}
*/
