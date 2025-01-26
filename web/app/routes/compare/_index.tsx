import { useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Chart } from "./Chart";
import { Button } from "../../components/ui/button";

export default function Index(): ReactNode {
    const [timeframe, setTimeframe] = useState("1D")
    const [selectedStocks, setSelectedStocks] = useState<{
        name: string
        symbol: string
    }[]>([
        {
            name: "Apple",
            symbol: "NASDAQ:AAPL",
        },
        {
            name: "Google",
            symbol: "NASDAQ:GOOGL",
        }
    ])

    const fakeStocks = [
        {
            name: "Apple",
            symbol: "AAPL",
            price: 150,
        },
        {
            name: "Google",
            symbol: "GOOGL",
            price: 3000,
        },
        {
            name: "Microsoft",
            symbol: "MSFT",
            price: 300,
        },
        {
            name: "Tesla",
            symbol: "TSLA",
            price: 700,
        },
        {
            name: "Facebook",
            symbol: "FB",
            price: 300,
        },
        {
            name: "Amazon",
            symbol: "AMZN",
            price: 3000,
        },
        {
            name: "Netflix",
            symbol: "NFLX",
            price: 500,
        },
        {
            name: "Nvidia",
            symbol: "NVDA",
            price: 200,
        },
        {
            name: "AMD",
            symbol: "AMD",
            price: 100,
        },
        {
            name: "Intel",
            symbol: "INTC",
            price: 50,
        },
        {
            name: "IBM",
            symbol: "IBM",
            price: 100,
        },
        {
            name: "Oracle",
            symbol: "ORCL",
            price: 100,
        },
        {
            name: "Cisco",
            symbol: "CSCO",
            price: 50,
        },
        {
            name: "Qualcomm",
            symbol: "QCOM",
            price: 150,
        },
        {
            name: "HP",
            symbol: "HPQ",
            price: 50,
        },
        {
            name: "Dell",
            symbol: "DELL",
            price: 50,
        },
        {
            name: "Sony",
            symbol: "SONY",
            price: 100,
        },
        {
            name: "Panasonic",
            symbol: "PCRFY",
            price: 50,
        },
        {
            name: "Nintendo",
            symbol: "NTDOY",
            price: 100,
        },
        {
            name: "Samsung",
            symbol: "SSNLF",
            price: 100,
        },
        {
            name: "LG",
            symbol: "LPL",
            price: 50,
        },
        {
            name: "Xiaomi",
            symbol: "XIACF",
            price: 50,
        },
        {
            name: "Alibaba",
            symbol: "BABA",
            price: 200,
        },
        {
            name: "Tencent",
            symbol: "TCEHY",
            price: 100,
        },
        {
            name: "Baidu",
            symbol: "BIDU",
            price: 50,
        },
        {
            name: "JD.com",
            symbol: "JD",
            price: 50,
        },
        {
            name: "Pinduoduo",
            symbol: "PDD",
            price: 50,
        },
        {
            name: "Meituan",
            symbol: "MPNGF",
            price: 50,
        },
        {
            name: "Twitter",
            symbol: "TWTR",
            price: 50,
        }
    ]


    const results = useQueries({
        queries: selectedStocks.map((stock) => ({
            queryKey: ["stock", stock.symbol, timeframe],
            queryFn: async () => {
                const req = await fetch(
                    `/api/data/prices?symbol=${stock.symbol}&timeframe=${timeframe}`
                )
                const json = await req.json()
                return json
            },
            refetchOnWindowFocus: true
        }))
    })

    const prices = useMemo(() => results ? results.map((result) => result?.data?.prices || []) : [], [results])

    if (results.some((result) => result.isLoading)) {
        return (
            <p>Loading</p>
        )
    }

    return (
        <div className="m-4 flex max-w-full flex-col gap-4 lg:flex-row">
            <div className="h-auto w-full lg:w-3/4">
                <Card className="h-full w-full">
                    <CardHeader>
                        <CardTitle>
                            Comparaison des prix
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex flex-row items-center gap-1 overflow-auto">
                            <Button type="submit" className="" onClick={(): void => setTimeframe("1D")} variant={timeframe === "1D" ? "default" : "outline"}>
                                1D
                            </Button>
                            <Button type="submit" className="" onClick={(): void => setTimeframe("1W")} variant={timeframe === "1W" ? "default" : "outline"}>
                                1W
                            </Button>
                            <Button type="submit" className="" onClick={(): void => setTimeframe("1M")} variant={timeframe === "1M" ? "default" : "outline"}>
                                1M
                            </Button>
                            <Button type="submit" className="" onClick={(): void => setTimeframe("1Y")} variant={timeframe === "1Y" ? "default" : "outline"}>
                                1Y
                            </Button>
                            <Button type="submit" className="" onClick={(): void => setTimeframe("5Y")} variant={timeframe === "5Y" ? "default" : "outline"}>
                                5Y
                            </Button>
                            <Button type="submit" className="" onClick={(): void => setTimeframe("all")} variant={timeframe === "all" ? "default" : "outline"}>
                                All
                            </Button>
                        </div>

                        <Chart
                            symbols={selectedStocks.map((stock) => stock.symbol)}
                            timeframe={timeframe}
                            prices={prices}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="h-auto w-full lg:w-1/4">
                <Card className="h-full w-full">
                    <CardHeader>
                        <CardTitle>
                            Ajouter des actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <Label>Nom de l'action</Label>
                            <Input placeholder="Nom de l'action" />
                        </div>

                        <div className="flex h-96 flex-col items-center justify-start gap-2 overflow-auto">
                            {fakeStocks.map((stock) => (
                                <div key={stock.symbol} className="flex flex-row gap-2">
                                    <p>{stock.name}</p>
                                    <p>{stock.symbol}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}