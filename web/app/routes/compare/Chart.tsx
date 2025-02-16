import { useMemo, useState, type ComponentType, type ReactNode } from "react";
// import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
// import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Chart as PrettyChart } from "../../components/charts/bigChart";

export default function Chart({ symbols, timeframe, prices, maxValue, minValue }: {
    timeframe: string,
    symbols: string[],
    prices: { date: string, [key: string]: number | string }[][],
    minValue: number,
    maxValue: number
}): ReactNode {

    const [selectedPeriod, setSelectedPeriod] = useState({
        isActive: false,
        startTime: 0,
        startPrice: 0,
        endTime: 0,
        endPrice: 0,
        change: 0
    })

    const [hidden, setHidden] = useState<string[]>([])

    const yAxisWidth = Math.max(
        (maxValue * 1.05).toFixed(0).toString().length * 8,
        (minValue * 0.85).toFixed(0).toString().length * 8
    )

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
            <PrettyChart
                data={prices}
                lines={[
                    ...symbols.map((symbol, index) => {
                        return {
                            softHide: hidden.includes(symbol),
                            dataKey: symbol,
                            label: symbol,
                            stroke: `hsl(var(--chart-${(index % 5) + 1}))`,
                            displayTooltip: !hidden.includes(symbol),
                            tooltipFormatter(value: number): string {
                                return new Intl.NumberFormat("fr-FR", {
                                    style: "currency",
                                    currency: "USD"
                                }).format(value)
                            },
                            displayLegend: true,
                            onClickLegend: (): void => {
                                console.log("clicked callback")

                                setHidden((prev) => {
                                    if (prev.includes(symbol)) {
                                        return prev.filter((item) => item !== symbol)
                                    }

                                    return [...prev, symbol]
                                })
                            }
                        }
                    }),
                    {
                        dataKey: "highlight",
                        stroke: selectedPeriod.isActive ? "hsl(var(--chart-1))" : "gray",
                        displayLegend: false
                    }
                ]}
                xAxis={{
                    dataKey: "date",
                    tickFormatter: formatDate,
                    tooltipFormatter(value): string {
                        return new Date(value).toLocaleString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        })
                    },
                }}
                yAxis={{
                    dataKey: undefined,
                    width: yAxisWidth,
                }}

                // selectedPeriod={selectedPeriod}
                // setSelectedPeriod={setSelectedPeriod}
            />
        )
    }, [prices, timeframe, yAxisWidth, selectedPeriod, symbols, hidden]);

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
