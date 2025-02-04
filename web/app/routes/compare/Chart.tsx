import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

export default function Chart({ symbols, timeframe, prices, maxValue, minValue }: {
    timeframe: string,
    symbols: string[],
    prices: { date: string, [key: string]: number | string }[][],
    minValue: number,
    maxValue: number
}): ReactNode {

    const [hidden, setHidden] = useState<string[]>([])

    const chartConfig: FullConfig = {
        // close: {
        //     label: "Prix",
        //     color: "hsl(var(--chart-1))"
        // },
        date: {
            label: "Date"
        }
    }

    const yAxisWidth = Math.max(
        (maxValue * 1.05).toFixed(0).toString().length * 8,
        (minValue * 0.85).toFixed(0).toString().length * 8
    )

    // From 1 to 5
    const maxColor = 5

    const memoizedLines = useMemo(() => {
        return symbols.map((symbol, index) => {
            return (
                <Line
                    key={symbol}
                    dataKey={symbol}
                    name={symbol}
                    stroke={`hsl(var(--chart-${(index % maxColor) + 1}))`}
                    strokeWidth={2}
                    dot={false}
                    hide={hidden.includes(symbol)}
                    isAnimationActive={false}
                />
            );
        });
    }, [symbols, hidden]);

    const memoizedChart = useMemo(() => {

        const formatDate = (dateToFormat: string): string => {
            const date = new Date(dateToFormat)

            if (timeframe === "1D") {
                return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            }

            if (timeframe === "1W" || timeframe === "1M") {
                return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
            }

            if (timeframe === "1Y" || timeframe === "5Y" || timeframe === "all") {
                return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
            }

            return date.toLocaleString("fr-FR")
        }

        return (
            <ChartContainer config={chartConfig} className="min-h-[400px] w-full overflow-hidden lg:h-[500px] lg:min-h-0">
                <ComposedChart accessibilityLayer={true} margin={{ top: 0, left: 0, right: 0, bottom: 0 }} data={prices}>
                    <CartesianGrid vertical={false} />

                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        scale="auto"
                        domain={[
                            (dataMin: number) => Math.floor(dataMin * 0.85),
                            (dataMax: number) => Math.ceil(dataMax * 1.05)
                        ]}
                        tickMargin={0}
                        fontSize={12}
                        width={yAxisWidth + 4}
                    />

                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        scale="auto"
                        allowDuplicatedCategory={false}
                    />

                    {memoizedLines}

                    <ChartLegend
                        content={<ChartLegendContent
                            formatter={(value): string => { return value }}
                            onClick={(value): void => {
                                console.log(value)

                                if (hidden.includes(value.value)) {
                                    setHidden(hidden.filter((h) => h !== value.value))
                                } else {
                                    setHidden([...hidden, value.value])
                                }
                            }}
                        />}
                    />

                    <ChartTooltip
                        wrapperStyle={{ outline: 'none' }}
                        isAnimationActive={true}
                        animationDuration={100}
                        offset={20}
                        position={{ y: 0 }}
                        content={<ChartTooltipContent
                            labelFormatter={(_, payload): string => {
                                return new Date(payload[0].payload.date).toLocaleString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: ["1D", "1W", "1M"].includes(timeframe) ? "numeric" : undefined,
                                    minute: ["1D", "1W", "1M"].includes(timeframe) ? "numeric" : undefined
                                })
                            }}
                        />}
                    />
                </ComposedChart>
            </ChartContainer>
        )
    }, [prices, hidden, memoizedLines, timeframe, yAxisWidth])

    return (
        <>
            {memoizedChart}
        </>
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
