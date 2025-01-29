import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate, useSearchParams, useSubmit } from "@remix-run/react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { fetchScreener } from "../../../utils/tradingview/request";
import { and, type ColumnScreenerMappingType, type ColumnTypeScreener, createFilterExpression, createFilterOperation } from "../../../utils/tradingview/filter";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchState } from 'react-zoom-pan-pinch'
import type { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import logger from "../../../../log";
import { cn } from "../../lib/utils";

const columns = [
    "close",
    "currency",
    "exchange",
    "change",
    "logoid",
    "market_cap_basic",

    "description"
] satisfies ColumnTypeScreener[]

type FilteredColumnMapping<TColumns extends readonly ColumnTypeScreener[]> = {
    // [K in TColumns[number]]: ColumnTypeMappingType[K];
    [K in TColumns[number]]: ColumnScreenerMappingType[K];
};

type ResultTyped<TColumns extends readonly ColumnTypeScreener[]> = FilteredColumnMapping<TColumns>;
type ResultType = ResultTyped<typeof columns> & {
    symbol: string
};

type ProcessedDataType = ResultType & {
    size: number
    color: string
    index: number
    total: number
}

type Market = "SP500" | "CAC40" | "NASDAQ100"
type Markets = {
    [key in Market]: {
        country: string
        symbolset: string[];
        markets: string[];
        range: [number, number]
    };
};
async function getData(market: Market = "SP500") {
    const markets: Markets = {
        "SP500": {
            country: "america",
            symbolset: ["SYML:SP;SPX"],
            markets: ["america"],
            range: [0, 300]
        },
        "CAC40": {
            country: "france",
            symbolset: ["SYML:EURONEXT;PX1"],
            markets: ["france"],
            range: [0, 40]
        },
        "NASDAQ100": {
            country: "america",
            symbolset: ["SYML:NASDAQ;NDX"],
            markets: ["america"],
            range: [0, 300]
        }
    }

    /*
    [
            {
                left: "market_cap_basic",
                operation: "nempty"
            },
            {
                left: "is_blacklisted",
                operation: "equal",
                right: false
            },
            {
                left: "name",
                operation: "not_in_range",
                right: ["GOOG"]
            }
        ]
            */

    const selectedMarket = markets[market] || markets.SP500

    const filter = and(
        createFilterOperation("market_cap_basic", "nempty"),
        // @ts-ignore
        createFilterExpression("is_blacklisted", "equal", false),
        createFilterExpression("name", "not_in_range", ["GOOG"]),
    )

    const { parsedResult } = await fetchScreener({
        labelProduct: "heatmap-stock",
        country: selectedMarket.country,
        columns: columns,
        filter: filter,
        sort: {
            sortBy: "market_cap_basic",
            sortOrder: "desc"
        },
        // biome-ignore lint/style/useNamingConvention: <explanation>
        ignore_unknown_fields: false,
        options: {
            lang: "fr"
        },
        range: selectedMarket.range,
        markets: selectedMarket.markets,
        symbols: {
            symbolset: selectedMarket.symbolset
        }
    })

    if (!parsedResult) {
        logger.error(`No result for ${market} in heatmap`)

        return []
    }

    return parsedResult as ResultType[]
}

export const loader: LoaderFunction = async ({ request }) => {

    const url = new URL(request.url)

    const market = url.searchParams.get("market") as Market | undefined

    const result = await getData(market)

    return {
        result
    }

}

export const action: ActionFunction = async ({ request }) => {
    const body = await request.formData()
    let market: Market = "SP500"

    if (body.get("market")) {
        market = body.get("market") as Market
    }

    const result = await getData(market)

    return {
        result
    }
}

export const meta: MetaFunction = () => {
    // if (!data) {
    // 	return []
    // }

    // const { title, description } = data

    // return [
    // 	{ title: title },
    // 	{ name: "og:title", content: title },
    // 	{ name: "description", content: description },
    // 	{ name: "og:description", content: description },
    // 	{ name: "canonical", content: "https://www.investor-helper.com/login" }
    // ]

    const title = "Investor Helper - Heatmap"
    const description = "Visualisation de la capitalisation boursière des entreprises du S&P 500, CAC 40 et NASDAQ 100."

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: "https://www.investor-helper.com/heatmap" }
    ]
}

const processData = (data: ResultType[] = []): ProcessedDataType[] => {
    if (!Array.isArray(data) || data.length === 0) {
        return []
    }
    const totalMarketCap = data.reduce((sum, stock) => sum + (stock.market_cap_basic || 0), 0)
    const colors = ['#4299E1', '#48BB78', '#F6AD55', '#9F7AEA', '#F687B3', '#ED64A6', '#4FD1C5', '#ECC94B', '#90CDF4', '#E9D8FD']

    const processed = data.map((stock, index) => ({
        ...stock,
        size: totalMarketCap > 0 ? ((stock.market_cap_basic || 0) / totalMarketCap) * 100 : 0,
        color: colors[index % colors.length],
        index,
        total: data.length
    }))

    return processed
}

const CustomTooltip = ({ active, payload }: {
    active: boolean,
    payload: {
        payload: ProcessedDataType
    }[],
    transformState: ReactZoomPanPinchState
}): ReactNode | null => {
    if (active && payload && payload.length > 0 && payload[0].payload) {
        const data = payload[0].payload as ProcessedDataType
        return (
            <div className="rounded border border-gray-200 bg-white p-2 shadow" key={data.symbol}>
                <p className="font-bold text-black">{data.description} ({data.symbol})</p>
                <p className="text-black">Market Cap: ${((data.market_cap_basic || 0).toLocaleString())} billion</p>
                <p className="text-black">Weight: {(data.size || 0).toFixed(2)}%</p>
                <p className="text-black">Position: {data.index + 1}/{data.total}</p>
            </div>
        )
    }
    return null
}

const CustomizedContent = (props: {
    x: number,
    y: number,
    width: number,
    height: number,
    value: number,
    description: ProcessedDataType["description"],
    symbol: ProcessedDataType["symbol"],
    change: ProcessedDataType["change"],
    logoid: ProcessedDataType["logoid"],
    transformState: ReactZoomPanPinchState
} | null): ReactNode => {
    if (!props) {
        return null
    }

    const { x, y, width, height, description, symbol, change, logoid } = props

    const colors = {
        darkGreen: {
            background: "#16a34a" // text-green-600
        },
        green: {
            background: "#22c55e" // text-green-500
        },
        lightGreen: {
            background: "#4ade80" // text-green-400
        },
        gray: {
            background: "#9ca3af" //text-gray-500
        },

        darkRed: {
            background: "#dc2626" // red-600
        },
        red: {
            background: "#ef4444" // red-500
        },
        lightRed: {
            background: "#f87171" // red-400
        }
    }

    const getColor = (change: number): {
        background: string
    } => {
        const thresholds = [
            { limit: 3, color: colors.darkGreen },
            { limit: 1.5, color: colors.green },
            { limit: 0.5, color: colors.lightGreen },
            { limit: -0.5, color: colors.gray },
            { limit: -1.5, color: colors.lightRed },
            { limit: -3, color: colors.red },
            { limit: Number.NEGATIVE_INFINITY, color: colors.darkRed }
        ];

        return thresholds.find(({ limit }) => change >= limit)?.color || colors.gray;
    };

    const color = getColor(change || 0)

    const fontSize = 24
    const minImageSize = width / 6

    const displayText = height > (fontSize * 3) + minImageSize && width > (description?.length / 2) * fontSize
    const bigImage = width < 50

    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={color.background} />
            <foreignObject x={x} y={y} width={width} height={height}>
                <div className={cn(
                    "flex size-full flex-col items-center justify-center",
                    bigImage ? "p-2" : "p-3"
                )}>
                    <img
                        src={`/api/image/symbol?name=${logoid}`}
                        alt={description || symbol || "Logo"}
                        className={cn(
                            "mx-auto rounded-full",
                            displayText ? "w-1/6" : (bigImage ? "w-full" : "w-1/2")
                        )}
                    />

                    <div
                        className={cn(
                            "flex flex-col items-center justify-center w-full",
                            displayText ? "block" : "hidden"
                        )}
                    >
                        <p className="truncate text-center">{description}</p>
                        <p className="truncate text-center">{symbol}</p>
                        <p className="truncate text-center">{change?.toFixed(2)}%</p>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
}

export default function Index(): ReactNode {
    const { result } = useLoaderData<typeof loader>()
    const resultAction = useActionData<typeof action>()

    const submit = useSubmit()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    if (!result || (resultAction && !resultAction.result)) {
        return <p>No Data</p>
    }

    const processedData = processData(resultAction?.result ?? result as ResultType[])

    if (!processedData || processedData.length === 0) {
        return <p>No Data (processed)</p>
    }


    const handleSubmit = (value: string): void => {
        const formData = new FormData()

        formData.append("market", value)

        submit(formData, { method: "post" })

        navigate(`/heatmap?market=${value}`)
    }

    const market = searchParams.get("market") || "SP500"

    return (
        <div className="relative h-[calc(100dvh-64px)] w-full overflow-hidden">

            <Form className="absolute top-0 left-0" method="POST">
                <div className="absolute top-0 left-0 z-10 m-4">
                    <Select 
                        name="market" 
                        defaultValue={market} 
                        onValueChange={(value) => handleSubmit(value)} 
                        aria-label="Choisir un marché"
                    >
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Choisir un marché" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SP500">S&P 500</SelectItem>
                            <SelectItem value="CAC40">CAC 40</SelectItem>
                            <SelectItem value="NASDAQ100">NASDAQ 100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Form>

            <div className="h-full w-full">
                <TransformWrapper
                    initialScale={1}
                    initialPositionX={0}
                    initialPositionY={0}
                >
                    {({ instance }): ReactNode => (
                        <div className="h-full w-full">
                            {/* <div className="absolute top-4 left-4 z-10 space-x-2">
                                <button onClick={() => zoomIn()} className="bg-blue-500 text-white px-4 py-2 rounded">Zoom In</button>
                                <button onClick={() => zoomOut()} className="bg-blue-500 text-white px-4 py-2 rounded">Zoom Out</button>
                                <button onClick={() => resetTransform()} className="bg-blue-500 text-white px-4 py-2 rounded">Reset</button>
                                <button onClick={() => console.log(instance.transformState)} className="bg-blue-500 text-white px-4 py-2 rounded">Instance</button>
                            </div> */}
                            <TransformComponent contentClass="!w-full !h-full" wrapperClass="!w-full !h-full">
                                <div className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            isAnimationActive={false}
                                            data={processedData}
                                            dataKey="size"
                                            aspectRatio={4 / 3}
                                            // @ts-expect-error - Props are automatically passed to the content component
                                            content={<CustomizedContent transformState={instance.transformState} />}
                                        >
                                            {/* @ts-expect-error - Props are automatically passed to the content component */}
                                            <Tooltip content={<CustomTooltip transformState={instance.transformState} />} />
                                        </Treemap>
                                    </ResponsiveContainer>

                                </div>
                            </TransformComponent>
                        </div>
                    )}
                </TransformWrapper>
            </div>
        </div>
    )
}