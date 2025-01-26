import { useMemo, type ComponentType, type ReactNode } from "react";
import type { Period } from "../../../utils/getPrices";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from "recharts";

export function Chart({ symbols, timeframe, prices }: {
    timeframe: string,
    symbols: string[],
    prices: Period[][]
}): ReactNode {
    const chartConfig: FullConfig = {
        close: {
            label: "Prix",
            color: "hsl(var(--chart-1))"
        },
        time: {
            label: "Date"
        }
    }

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp * 1000)

        if (timeframe === "1D") {
            return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        }

        if (timeframe === "1W" || timeframe === "1M") {
            return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
        }

        if (timeframe === "1Y" || timeframe === "all") {
            return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
        }

        return date.toLocaleString("fr-FR")
    }

    // const maxValue = Math.max(...prices.map((price) => price.map((p) => Math.floor(p?.close)).reduce((acc, val) => acc.concat(val), [])))
    const maxValue = Math.max(...prices.map((price) => Math.floor(price[0]?.close)))

    const yAxisWidth = Math.max(
        maxValue.toString().length * 8,
    )

    return (
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full overflow-hidden lg:h-[500px] lg:min-h-0">
            <ComposedChart accessibilityLayer={true} margin={{ top: 0, left: 0, right: 0, bottom: 0 }} data={prices[0]}>
                <CartesianGrid vertical={false} />

                <YAxis
                    dataKey="close"
                    tickLine={false}
                    axisLine={false}
                    scale="auto"
                    domain={[
                        (dataMin: number) => Math.floor(dataMin * 0.85),
                        (dataMax: number) => Math.ceil(dataMax * 1.05)
                    ]}
                    tickMargin={0}
                    fontSize={12}
                    width={yAxisWidth}
                />

                <XAxis
                    dataKey="time"
                    tickFormatter={formatDate}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    scale="auto"
                    allowDuplicatedCategory={false}
                />

                {symbols.map((symbol, index) => (
                    <Line
                        key={`chart-line-${symbol}`}
                        data={prices[index]}
                        // yAxisId={`close-${symbol}`}
                        // xAxisId={`time-${symbol}`}
                        dataKey="close"

                        name={symbol}
                        stroke="var(--color-close)"
                        strokeWidth={2}
                        dot={false}
                        className="z-10"
                    />
                ))}

                <Legend />

                <Tooltip />

                {/* <ChartLegend
                    content={
                        <ChartLegendContent
                            renderHidden={true}

                            onClick={(item): void => {
                                const config = chartConfig[item.dataKey as string]

                                if (config?.onClick) {
                                    config.onClick()
                                }
                            }}
                        />
                    }
                /> */}

                {/* <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            indicator="dot"
                            labelFormatter={(_value, dataLabel): string => {
                                return new Date(dataLabel[0].payload.time * 1000).toLocaleString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "numeric"
                                })
                            }}
                        />
                    }
                /> */}
            </ComposedChart>
        </ChartContainer>
    )
}

interface FullConfig {
    [x: string]: {
        label?: ReactNode
        icon?: ComponentType
    } & (
        | {
            color?: string
            theme?: never
        }
        | {
            color?: never
            theme: Record<"light" | "dark", string>
        }
    ) &
    (
        | {
            display?: boolean
            onClick?: () => void
        }
        | {
            display?: never
            onClick?: never
        }
    )
}
