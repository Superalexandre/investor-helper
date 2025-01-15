import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
// import { ChartContainer } from "../../components/ui/chart";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { fetchScreener } from "../../../utils/tradingview/request";
import { and, ColumnScreenerMappingType, ColumnTypeScreener, ColumnTypeStock, createFilterExpression, createFilterOperation } from "../../../utils/tradingview/filter";
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

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
}

export const loader: LoaderFunction = async () => {
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

    const filter = and(
        createFilterOperation("market_cap_basic", "nempty"),
        // @ts-ignore
        createFilterExpression("is_blacklisted", "equal", false),
        createFilterExpression("name", "not_in_range", ["GOOG"]),
    )

    const { parsedResult } = await fetchScreener({
        labelProduct: "heatmap-stock",
        country: "america",
        columns: columns,
        filter: filter,
        sort: {
            sortBy: "market_cap_basic",
            sortOrder: "desc"
        },
        ignore_unknown_fields: false,
        options: {
            lang: "fr"
        },
        range: [0, 300],
        markets: ["america"],
        symbols: {
            symbolset: ["SYML:SP;SPX"]
        }
    })

    if (!parsedResult) {
        return {
            result: []
        }
    }

    return {
        result: parsedResult as ResultType[]
    }
}

const processData = (data: ResultType[] = []) => {
    if (!Array.isArray(data) || data.length === 0) {
        return []
    }
    const totalMarketCap = data.reduce((sum, stock) => sum + (stock.market_cap_basic || 0), 0)
    const colors = ['#4299E1', '#48BB78', '#F6AD55', '#9F7AEA', '#F687B3', '#ED64A6', '#4FD1C5', '#ECC94B', '#90CDF4', '#E9D8FD']

    const processed = data.map((stock, index) => ({
        ...stock,
        size: totalMarketCap > 0 ? ((stock.market_cap_basic || 0) / totalMarketCap) * 100 : 0,
        color: colors[index % colors.length],
    }))

    return processed as ProcessedDataType[]
}

const CustomTooltip = ({ active, payload, transformState }: any) => {
    if (active && payload && payload.length && payload[0].payload) {
        const data = payload[0].payload as ProcessedDataType
        return (
            <div className="bg-white p-2 border border-gray-200 rounded shadow" key={data.symbol}>
                <p className="font-bold text-black">{data.description} ({data.symbol})</p>
                <p className="text-black">Market Cap: ${((data.market_cap_basic || 0).toLocaleString())} billion</p>
                <p className="text-black">Weight: {(data.size || 0).toFixed(2)}%</p>
            </div>
        )
    }
    return null
}

const CustomizedContent = (props: any) => {
    if (!props) return null

    const { x, y, width, height, value, description, symbol, change, logoid, transformState } = props as {
        x: number,
        y: number,
        width: number,
        height: number,
        value: number,
        description: ProcessedDataType["description"],
        symbol: ProcessedDataType["symbol"],
        change: ProcessedDataType["change"],
        logoid: ProcessedDataType["logoid"],
        transformState: {
            previousScale: number,
            scale: number,
            positionX: number,
            positionY: number,
        }
    }

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


    let color = colors.gray
    if (change >= 3) {
        color = colors.darkGreen
    } else if (change >= 1.5) {
        color = colors.green
    } else if (change >= 0.5) {
        color = colors.lightGreen
    } else if (change <= -3) {
        color = colors.darkRed
    } else if (change <= -1.5) {
        color = colors.red
    } else if (change < -0.5) {
        color = colors.lightRed
    }

    const fontSize = 12

    const displayDescription = width > description?.length * fontSize
    const displaySymbol = width > symbol?.length * fontSize

    let prettyDescription = description || ""

    if (!displayDescription) {
        // Truncate description as long as possible
        prettyDescription = description?.slice(0, Math.floor(width / fontSize)) + "..."

        // If the description is too short, hide it
        if (prettyDescription.length < 3) {
            prettyDescription = ""
        }
    }

    // const scale = transformState.scale

    // const scaledWidth = width * scale
    // const scaledHeight = height * scale

    // const scaledX = x * scale
    // const scaledY = y * scale

    // return (
    //     <g>
    //         <rect x={scaledX} y={scaledY} width={scaledWidth} height={scaledHeight} fill={color.background} />
    //         <text x={scaledX + scaledWidth / 2} y={scaledY + scaledHeight / 2} textAnchor="middle" fill="#fff" fontSize={12} dy={4} className="">
    //             {prettyDescription}
    //         </text>
    //         <text x={scaledX + scaledWidth / 2} y={scaledY + scaledHeight / 2 + 15} textAnchor="middle" fill="#fff" fontSize={fontSize} dy={4}>
    //             {displaySymbol ? symbol : ""}
    //         </text>
    //         <text x={scaledX + scaledWidth / 2} y={scaledY + scaledHeight / 2 + 30} textAnchor="middle" fill="#fff" fontSize={fontSize} dy={4}>
    //             {`${change?.toFixed(2)}%`}
    //         </text>
    //     </g>
    // )

    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={color.background} />

            <image 
                x={x + 5} 
                y={y + 5} 
                width={20} 
                height={20} 
                href={"/api/image/symbol?name=" + logoid} 
            />

            <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12} dy={4} className="">
                {prettyDescription}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 15} textAnchor="middle" fill="#fff" fontSize={fontSize} dy={4}>
                {displaySymbol ? symbol : ""}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 30} textAnchor="middle" fill="#fff" fontSize={fontSize} dy={4}>
                {`${change?.toFixed(2)}%`}
            </text>
        </g>
    )
}

export default function Index() {
    const { result } = useLoaderData<typeof loader>()

    if (!result) {
        return <p>No Data</p>
    }

    const processedData = processData(result as ResultType[])

    if (!processedData || processedData.length === 0) {
        return <p>No Data</p>
    }

    return (
        <div className="w-full h-[calc(100vh-64px)] overflow-hidden relative">
            <div className="w-full h-full">
                <TransformWrapper
                    initialScale={1}
                    initialPositionX={0}
                    initialPositionY={0}
                >
                    {({ zoomIn, zoomOut, resetTransform, instance }) => (
                        <div className="h-full w-full">
                            {/* <div className="absolute top-4 left-4 z-10 space-x-2">
                                <button onClick={() => zoomIn()} className="bg-blue-500 text-white px-4 py-2 rounded">Zoom In</button>
                                <button onClick={() => zoomOut()} className="bg-blue-500 text-white px-4 py-2 rounded">Zoom Out</button>
                                <button onClick={() => resetTransform()} className="bg-blue-500 text-white px-4 py-2 rounded">Reset</button>
                                <button onClick={() => console.log(instance.transformState)} className="bg-blue-500 text-white px-4 py-2 rounded">Instance</button>
                            </div> */}
                            <TransformComponent contentClass="!w-full !h-full" wrapperClass="!w-full !h-full">
                                <div className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            isAnimationActive={false}
                                            data={processedData}
                                            dataKey="size"
                                            aspectRatio={4 / 3}
                                            content={<CustomizedContent transformState={instance.transformState} />}
                                        >
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