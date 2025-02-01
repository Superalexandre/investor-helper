import { useQuery } from "@tanstack/react-query";
import { type ComponentType, type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from "react";
import type { Period } from "../../../../utils/getPrices";
import { Button } from "../../../components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Skeleton } from "../../../components/ui/skeleton";

interface Response {
    prices: Period[],
    timeframe: string,
    range: number
    error: boolean
}

export function FullChart({ symbol, setInfo }: {
    symbol: string,
    setInfo: Dispatch<SetStateAction<{
        change?: number;
        price?: number;
        loading: boolean;
    }>>
}): ReactNode {
    const [timeframe, setTimeframe] = useState("1D")

    const {
        data,
        isPending,
        error
    } = useQuery<Response>({
        queryKey: [
            "dataPrices",
            {
                symbol: symbol,
                timeframe: timeframe
            }
        ],
        queryFn: async (): Promise<Response> => {
            const req = await fetch(
                `/api/data/prices?symbol=${symbol}&timeframe=${timeframe}`
            )
            const json = await req.json()

            return json
        },
        refetchOnWindowFocus: true
    })

    useEffect(() => {
        const firstPrice = data?.prices[0]?.close ?? 0
        const lastPrice = data?.prices.at(-1)?.close ?? 0

        const change = lastPrice - firstPrice
        const percentageChange = (change * 100) / (firstPrice || 1)

        setInfo({
            loading: isPending,
            change: percentageChange,
            price: lastPrice
        })
    }, [data, setInfo, isPending])

    if (isPending) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-row items-center gap-1">
                    <Skeleton className="h-8 w-12" />

                    <Skeleton className="h-8 w-12" />

                    <Skeleton className="h-8 w-12" />

                    <Skeleton className="h-8 w-12" />

                    <Skeleton className="h-8 w-12" />

                    <Skeleton className="h-8 w-12" />
                </div>

                <Skeleton className="h-[400px] w-full lg:h-[500px]" />
            </div>
        )
    }

    if (!data || error || data.error) {
        return <p>No prices</p>
    }

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

        if (data.timeframe === "1D") {
            return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        }

        if (data.timeframe === "1W" || data.timeframe === "1M") {
            return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
        }

        if (data.timeframe === "1Y" || data.timeframe === "all") {
            return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
        }

        return date.toLocaleString("fr-FR")
    }

    const maxValue = Math.max(...data.prices.map((price) => Math.floor(price?.close)))

    const yAxisWidth = Math.max(
        maxValue.toString().length * 8,
    )

    // console.log(data)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center gap-1 overflow-auto">
                <Button type="submit" className="" onClick={(): void => setTimeframe("1D")} variant={data.timeframe === "1D" ? "default" : "outline"}>
                    1D
                </Button>
                <Button type="submit" className="" onClick={(): void => setTimeframe("1W")} variant={data.timeframe === "1W" ? "default" : "outline"}>
                    1W
                </Button>
                <Button type="submit" className="" onClick={(): void => setTimeframe("1M")} variant={data.timeframe === "1M" ? "default" : "outline"}>
                    1M
                </Button>
                <Button type="submit" className="" onClick={(): void => setTimeframe("1Y")} variant={data.timeframe === "1Y" ? "default" : "outline"}>
                    1Y
                </Button>
                <Button type="submit" className="" onClick={(): void => setTimeframe("5Y")} variant={data.timeframe === "5Y" ? "default" : "outline"}>
                    5Y
                </Button>
                <Button type="submit" className="" onClick={(): void => setTimeframe("all")} variant={data.timeframe === "all" ? "default" : "outline"}>
                    All
                </Button>
            </div>

            <ChartContainer config={chartConfig} className="min-h-[400px] w-full overflow-hidden lg:h-[500px] lg:min-h-0">
                <ComposedChart data={data.prices} accessibilityLayer={true} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} />

                    <XAxis
                        dataKey="time"
                        tickFormatter={formatDate}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        scale="auto"
                    />

                    <YAxis
                        dataKey="close"
                        yAxisId="close"
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

                    <Line
                        yAxisId="close"
                        dataKey="close"
                        stroke="var(--color-close)"
                        strokeWidth={2}
                        dot={false}
                        className="z-10"
                    />

                    <ChartLegend
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
                    />

                    <ChartTooltip
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
                    />
                </ComposedChart>
            </ChartContainer>
        </div>
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
