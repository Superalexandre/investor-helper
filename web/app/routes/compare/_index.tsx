import React, { useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useQueries, useQuery } from "@tanstack/react-query";
import Chart from "./Chart";
import { Button } from "../../components/ui/button";
import { Search } from "./Search";
import { Badge } from "../../components/ui/badge";
import { XIcon } from "lucide-react";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";

export default function Index(): ReactNode {
    const [timeframe, setTimeframe] = useQueryState("timeframe", parseAsStringLiteral(["1D", "1W", "1M", "1Y", "5Y"]).withDefault("1D"))
    const [selectedStocks, setSelectedStocks] = useQueryState("stocks", parseAsArrayOf(parseAsString).withDefault([]))

    // const results = useQueries({
    //     queries: selectedStocks.map((stock) => ({
    //         queryKey: ["stock", stock, timeframe],
    //         queryFn: async () => {
    //             const req = await fetch(
    //                 `/api/data/prices?symbol=${stock}&timeframe=${timeframe}`
    //             )
    //             const json = await req.json()
    //             return json
    //         },
    //         refetchOnWindowFocus: true
    //     }))
    // })

    // const prices = useMemo(() => results ? results.map((result) => result?.data?.prices || []) : [], [results])

    const {
        data: prices,
        isLoading
    } = useQuery({
        queryKey: ["stocks", selectedStocks, timeframe],
        queryFn: async () => {
            const req = await fetch(
                `/api/data/prices/multiples?symbols=${selectedStocks.join(",")}&timeframe=${timeframe}`
            )
            const json = await req.json()
            return json
        },
        refetchOnWindowFocus: true
    })

    if (isLoading) {
        return <p>Loading...</p>
    }

    // if (results.some((result) => result.isLoading)) {
    //     return (
    //         <p>Loading</p>
    //     )
    // }
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
                            <Button type="submit" className="" onClick={() => setTimeframe("1D")} variant={timeframe === "1D" ? "default" : "outline"}>
                                1D
                            </Button>
                            <Button type="submit" className="" onClick={() => setTimeframe("1W")} variant={timeframe === "1W" ? "default" : "outline"}>
                                1W
                            </Button>
                            <Button type="submit" className="" onClick={() => setTimeframe("1M")} variant={timeframe === "1M" ? "default" : "outline"}>
                                1M
                            </Button>
                            <Button type="submit" className="" onClick={() => setTimeframe("1Y")} variant={timeframe === "1Y" ? "default" : "outline"}>
                                1Y
                            </Button>
                            <Button type="submit" className="" onClick={() => setTimeframe("5Y")} variant={timeframe === "5Y" ? "default" : "outline"}>
                                5Y
                            </Button>
                            {/* <Button type="submit" className="" onClick={(): void => setTimeframe("all")} variant={timeframe === "all" ? "default" : "outline"}>
                                All
                            </Button> */}
                        </div>

                        <React.Suspense fallback={<div>Loading graph...</div>}>
                            <Chart
                                symbols={selectedStocks.map((stock) => stock)}
                                timeframe={timeframe}
                                prices={prices?.prices || []}
                                maxValue={prices?.range?.max || 0}
                                minValue={prices?.range?.min || 0}
                            />
                        </React.Suspense>
                        {/* 
                        <Chart
                            symbols={selectedStocks.map((stock) => stock)}
                            timeframe={timeframe}
                            prices={prices.prices}
                        /> */}
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
                        <Search
                            selectedStocks={selectedStocks}
                            setSelectedStocks={setSelectedStocks}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}