import { z } from "zod"
import { FilterOperation, FilterOperationSchemaNested, LangSchema, MarketsSchema, SortBySchema } from "./filter";

// Request structure
const TradingViewRequestSchema = z.object({
    columns: z.array(z.string()),
    filter2: FilterOperationSchemaNested,
    ignore_unknown_fields: z.boolean(),
    options: z.object({
        lang: LangSchema,
    }),
    range: z.tuple([z.number(), z.number()]),
    sort: z.object({
        sortBy: SortBySchema,
        sortOrder: z.enum(["asc", "desc"]),
    }),
    symbols: z.record(z.unknown()), // Symbols can be any structure
    markets: MarketsSchema,
});
type TradingViewRequest = z.infer<typeof TradingViewRequestSchema>;

type Column =
    | "name"
    | "description"
    | "logoid"
    | "update_mode"
    | "type"
    | "typespecs"
    | "close"
    | "pricescale"
    | "minmov"
    | "fractional"
    | "minmove2"
    | "currency"
    | "change"
    | "volume"
    | "relative_volume_10d_calc"
    | "market_cap_basic"
    | "fundamental_currency_code"
    | "price_earnings_ttm"
    | "earnings_per_share_diluted_ttm"
    | "earnings_per_share_diluted_yoy_growth_ttm"
    | "dividends_yield_current"
    | "sector.tr"
    | "market"
    | "sector"
    | "recommendation_mark"
    | "exchange"
    | "enterprise_value_current"
    | "country.tr"
    | "country_code_fund"
    | "float_shares_percent_current";

// Define the columns array as dynamic
type ColumnsArray = Column[];

type TradingViewDataItemDynamic<TColumns extends ColumnsArray> = {
    s: string; // Symbol with exchange
    d: { [K in TColumns[number]]: any }; // Map each column to its corresponding type
};

interface TradingViewResponseDynamic<TColumns extends ColumnsArray> {
    totalCount: number;
    data: TradingViewDataItemDynamic<TColumns>[];
}

// Helper function to create a typed columns map
const createColumnTypeMap = <TColumns extends ColumnsArray>(columns: TColumns) => {
    return columns.reduce<Record<string, any>>((map, column) => {
        map[column] = null; // Default type is `any` or null; can be customized for each column
        return map;
    }, {});
};

function parseTradingViewResponse<TColumns extends ColumnsArray>(
    columns: TColumns,
    response: TradingViewResponseDynamic<TColumns>
): Array<Record<TColumns[number], any>> {
    return response.data.map((item) =>
        columns.reduce((acc, column, index) => {
            // Access item.d[column], since d is an object where the keys are from the columns
            acc[column] = item.d[column]; // Correctly accessing item.d[column]
            return acc;
        }, {} as Record<TColumns[number], any>) // Explicitly type the accumulator
    );
}

// Utility function to convert snake_case to camelCase
function snakeToCamel(snake: string): string {
    return snake.replace(/(_\w)/g, (matches) => matches[1].toUpperCase());
}

// Automatically generate the `columns` field
function generateColumns(columnsSnakeCase: string[]): string[] {
    return columnsSnakeCase.map(snakeToCamel);
}

// Parse the response and map columns dynamically, converting to camelCase
function parseTradingViewResponseCamelCase<TColumns extends string[]>(
    columnsSnakeCase: TColumns,
    response: TradingViewResponseDynamic<TColumns>
): Array<Record<string, any>> {
    // Convert columns to camelCase
    const columnsCamelCase = generateColumns(columnsSnakeCase);

    // Map response data to camelCase keys
    return response.data.map((item) => {
        const parsedObject = {} as Record<string, any>;
        columnsCamelCase.forEach((camelColumn, index) => {
            parsedObject[camelColumn] = item.d[index];
        });
        return parsedObject;
    });
}


const fetchDynamicData = async <TColumns extends ColumnsArray>({
    country, filter, columns
}: {
    country: string,
    columns: TColumns
    filter?: FilterOperation
}): Promise<{
    result: TradingViewResponseDynamic<TColumns>,
    parsed: Record<TColumns[number], any>[]
}> => {
    const url = `https://scanner.tradingview.com/${country}/scan?label-product=screener-stock`;

    const requestBody = {
        columns,
        filter2: filter,
        options: {
            lang: "en",
        },
        range: [0, 20],
        sort: {
            sortBy: "change",
            sortOrder: "desc",
        },
    };

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
    });



    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const result: TradingViewResponseDynamic<TColumns> = await response.json();
    const parsed = parseTradingViewResponse(columns, result);

    return {
        result,
        parsed
    }
};


const fetchExample = async () => {
    const columns: ColumnsArray = ["name", "description", "close"]

    const { result, parsed } = await fetchDynamicData({
        country: "US",
        columns,
    });

    console.log(parsed[0]);
}