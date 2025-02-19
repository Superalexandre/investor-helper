import { useQuery } from "@tanstack/react-query";
import { type ComponentType, type Dispatch, type ReactNode, type SetStateAction, useEffect, useMemo, useState } from "react";
import type { Period } from "../../../../utils/getPrices";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Chart } from "../../../components/charts/bigChart";

interface Response {
    prices: Period[],
    timeframe: string,
    range: number
    error: boolean
}

export function FullChart({ symbol, setInfo, currency }: {
    symbol: string,
    currency: string,
    setInfo: Dispatch<SetStateAction<{
        change?: number;
        price?: number;
        loading: boolean;
    }>>

}): ReactNode {
    const [timeframe, setTimeframe] = useState("1D")

    const [selectedPeriod, setSelectedPeriod] = useState({
        isActive: false,
        startTime: 0,
        startPrice: 0,
        endTime: 0,
        endPrice: 0,
        change: 0
    })

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
            price: firstPrice
        })
    }, [data, setInfo, isPending])

    const memoizedData = useMemo(() => {
        if (!data || !data.prices) {
            return []
        }

        return data.prices.map((price) => ({
            ...price,
            time: price.time,
            highlight: selectedPeriod.isActive && price.time >= selectedPeriod.startTime && price.time <= selectedPeriod.endTime ? price.close : null
        }))
    }, [data, selectedPeriod])

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
    const minValue = Math.min(...data.prices.map((price) => Math.floor(price?.close)))

    const yAxisWidth = Math.max(
        maxValue.toString().length * 8,
        minValue.toString().length * 8
    )

    const safeCurrency = Intl.supportedValuesOf("currency").includes(currency) ? currency : undefined

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

            <Chart
                data={memoizedData}
                lines={[
                    {
                        dataKey: "close",
                        label: "Prix",
                        stroke: selectedPeriod.isActive ? "gray" : "hsl(var(--chart-1))",
                        absoluteStrokeColor: "hsl(var(--chart-1))",
                        displayLegend: true,
                        displayTooltip: true,
                        tooltipFormatter(value): string {
                            const prettyCurrency = new Intl.NumberFormat("fr-FR", safeCurrency ? {
                                style: "currency",
                                currency: safeCurrency
                            } : undefined).format(value)

                            return `${prettyCurrency} ${safeCurrency ? "" : currency}`
                        }
                    },
                    {
                        dataKey: "highlight",
                        stroke: selectedPeriod.isActive ? "hsl(var(--chart-1))" : "gray",
                        displayLegend: false,
                    }
                ]}
                xAxis={{
                    dataKey: "time",
                    tickFormatter: formatDate,
                    tooltipFormatter(value): string {
                        return new Date(value * 1000).toLocaleString("fr-FR", {
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
                    dataKey: "close",
                    width: yAxisWidth + 8,
                }}

                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
            />
        </div>
    )
}