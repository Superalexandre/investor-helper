import { useQuery } from "@tanstack/react-query";
import { type ComponentType, type Dispatch, type ReactNode, type SetStateAction, useEffect, useMemo, useState } from "react";
import type { Period } from "../../../../utils/getPrices";
import { Button } from "../../../components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart";
import { CartesianGrid, Cell, ComposedChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "../../../components/ui/skeleton";
import { TableData } from "./TableData";
import { ChartData } from "./ChartData";
import { Link } from "@remix-run/react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

export function WalletData({ walletId }: { walletId: string }): ReactNode {
    const [displayValue, setDisplayValue] = useState<"value" | "netValue">("netValue")
    // const [timeframe, setTimeframe] = useState("1D")

    const {
        data,
        isPending,
        error,
    } = useQuery<{
        data: {
            allPrices: {
                date: string
                value: number
                netValue: number
            }[],
            prices: {
                logoid: string,
                description: string,
                totalValue: number
                symbol: string,
                quantity: number,
                performance: number,
                performancePercentage: number
                country: string,
            }[],
            portfolioWeights: {
                symbol: string
                description: string
                weight: number
            }[],
            sectorWeights: {
                sector: string
                weight: number
                "sector.tr": string
            }[]
        }
    }>({
        queryKey: ["walletPrice", walletId],
        queryFn: async () => {
            const req = await fetch(
                `/api/wallet/info/prices?walletId=${walletId}`
            )
            const json = await req.json()

            // Fake loading
            // await new Promise((resolve) => setTimeout(resolve, 500_000))

            return json
        },
        refetchOnWindowFocus: true
    })

    if (isPending) {
        return (
            <Skeleton className="h-[400px] w-full lg:h-[500px]" />
        )
    }

    if (!data) {
        return <p>No prices</p>
    }

    console.log(data)

    const colors = [
        "#0088FE",
        "#00C49F",
        "#FFBB28",
        "#FF8042",
        "#8884D8",
        "#82CA9D",
        "#A4DE6C",
        "#D0ED57",
        "#FFC658",
        "#FFD700",
    ]

    console.log(data.data)

    console.log(data.data.prices.map((item) => item.country))

    return (
        <div className="flex w-full flex-col gap-4 p-4">
            <Card className="w-full border-card-border">
                <CardHeader>
                    <CardTitle>Portefeuille</CardTitle>
                </CardHeader>

                <CardContent className="w-full overflow-auto">
                    <TableData prices={data.data.prices} />
                </CardContent>
            </Card>

            <Card className="border-card-border">
                <CardHeader>
                    <CardTitle>Performance</CardTitle>
                </CardHeader>

                <CardContent>
                    <ChartData allPrices={data.data.allPrices} />
                </CardContent>
            </Card>

            <div className="flex w-full flex-col gap-4 md:flex-row">
                <Card className="w-full border-card-border">
                    <CardHeader>
                        <CardTitle>Composition du portefeuille</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <div className="h-[300px] w-full md:w-1/2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.data.portfolioWeights}
                                            dataKey="weight"
                                            nameKey="symbol"
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            width="100%"
                                            height="100%"
                                        >
                                            {data.data.portfolioWeights.map((entry, index) => (
                                                <Cell key={`cell-${entry.symbol}`} fill={colors[index % colors.length]} />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            content={({ payload }): ReactNode => {
                                                if (payload && payload.length > 0) {
                                                    const { symbol, weight, description } = payload[0].payload
                                                    return (
                                                        <div className="rounded bg-background p-2 shadow">
                                                            <p className="font-bold">{symbol}</p>
                                                            <p>{description}</p>
                                                            <p>{weight.toFixed(2)}%</p>
                                                        </div>
                                                    )
                                                }

                                                return null
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="flex w-full flex-col gap-2 md:w-1/2">
                                {data.data.portfolioWeights.map((item) => (
                                    <li key={item.symbol} className="flex w-full flex-row items-center gap-2">
                                        <span className="flex-grow truncate pr-2">{item.description}</span>
                                        <span className="font-bold">{item.weight?.toFixed(2)}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full border-card-border">
                    <CardHeader>
                        <CardTitle>Composition des secteurs du portefeuille</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <div className="h-[300px] w-full md:w-1/2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.data.sectorWeights}
                                            dataKey="weight"
                                            nameKey="sector.tr"
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            width="100%"
                                            height="100%"
                                        >
                                            {data.data.sectorWeights.map((entry, index) => (
                                                <Cell key={`cell-${entry.sector}`} fill={colors[index % colors.length]} />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            content={({ payload }): ReactNode => {
                                                if (payload && payload.length > 0) {
                                                    const { weight } = payload[0].payload
                                                    return (
                                                        <div className="rounded bg-background p-2 shadow">
                                                            <p className="font-bold">{payload[0].payload["sector.tr"]}</p>
                                                            <p>{weight.toFixed(2)}%</p>
                                                        </div>
                                                    )
                                                }

                                                return null
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="flex w-full flex-col gap-2 md:w-1/2">
                                {data.data.sectorWeights.map((item) => (
                                    <li key={item["sector.tr"]} className="flex w-full flex-row items-center gap-2">
                                        <span className="flex-grow">{item["sector.tr"]}</span>
                                        <span className="font-bold">{item.weight?.toFixed(2)}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}