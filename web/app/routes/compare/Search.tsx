import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useDebounceValue } from "../../hooks/useDebounceValue";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { normalizeSymbolHtml } from "../../../utils/normalizeSymbol";
import { Badge } from "../../components/ui/badge";
import { PlusIcon, XIcon } from "lucide-react";

interface Stock {
    name: string
    symbol: string
}

interface SearchParams {
    selectedStocks: string[],
    // setSelectedStocks: (stocks: Stock[]) => void
    setSelectedStocks: Dispatch<SetStateAction<string[]>>
}

export function Search({
    selectedStocks,
    setSelectedStocks,
}: SearchParams): ReactNode {
    const [debouncedValue, setDebouncedValue, setForceValue] = useDebounceValue("", 750)

    const {
        data,
        isPending
    } = useQuery({
        queryKey: ["search", debouncedValue, "allSymbol"],
        queryFn: async () => {
            const req = await fetch(`/api/search?search=${debouncedValue}&searching=allSymbol`)
            const json = await req.json()

            return json
        },
        refetchOnWindowFocus: true,
        enabled: !!debouncedValue
    })

    return (
        <div className="flex flex-col gap-4">

            <div className="flex flex-row flex-wrap items-center gap-2">
                {selectedStocks.length > 0 ?
                    selectedStocks.map((stock) => (
                        <Badge
                            key={stock}
                            variant="outline"
                            className="flex h-8 flex-row items-center justify-center gap-2"
                        >
                            <span className="truncate">{stock}</span>

                            <Button
                                className="h-auto w-auto p-1"
                                variant="ghost"
                                onClick={(): void => setSelectedStocks(selectedStocks.filter((s) => s !== stock))}
                            >
                                <XIcon className="size-4" />
                            </Button>
                        </Badge>
                    )) : null}
            </div>
            <div className="flex flex-col gap-2">
                <Label>Nom de l'action</Label>
                <Input
                    placeholder="Nom de l'action"
                    // value={debouncedValue}
                    onChange={(event): void => setDebouncedValue(event.target.value)}

                />
            </div>

            <div className="flex h-96 flex-col items-center justify-start gap-2 overflow-auto">
                {isPending && debouncedValue ? <Skeleton className="h-10 w-full" /> : null}
                {!isPending && data ?
                    <DisplayStocks
                        stocks={data?.symbols || []}
                        setSelectedStocks={setSelectedStocks}
                        selectedStocks={selectedStocks}
                    /> : null}
            </div>
        </div>
    )
}

function DisplayStocks({ stocks, selectedStocks, setSelectedStocks }: { stocks: { prefix?: string, name: string, symbol: string, description: string, logoid: string, exchange: string }[], selectedStocks: SearchParams["selectedStocks"], setSelectedStocks: SearchParams["setSelectedStocks"] }): ReactNode {
    return stocks.map((stock) => {
        console.log(stock)

        const symbol = normalizeSymbolHtml(stock.symbol)
        const name = normalizeSymbolHtml(stock.description)
        const exchange = normalizeSymbolHtml(stock.exchange)
        const prefix = stock.prefix?.toUpperCase() ?? stock.exchange.toUpperCase()

        const fullSymbol = `${prefix}:${symbol}`

        return (
            <div key={fullSymbol} className="flex w-full flex-row items-center gap-2">
                <Button
                    onClick={(): void => {
                        if (selectedStocks.includes(fullSymbol)) {
                            // setSelectedStocks(selectedStocks.filter((s) => s !== symbol))
                            return
                        }

                        setSelectedStocks((prev) => [...prev, fullSymbol])
                    }}
                    disabled={selectedStocks.includes(fullSymbol)}
                >
                    <PlusIcon />
                </Button>

                <p className="truncate">{fullSymbol}</p>
                <p className="truncate">{name}</p>
            </div>
        )
    })
}