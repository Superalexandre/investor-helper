import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { MdDelete } from "react-icons/md"
import { useDebounceValue } from "usehooks-ts"
import { Label } from "./ui/label"

interface SelectSymbolType {
    symbol: string
    description: string
    exchange: string
    logoid: string
    price: number
    quantity: number
    currency_code: string
}

export function normalizeSymbol(symbol: string) {
    return symbol.replace(/<[^>]*>/g, "")
}

export function SearchSymbol({
    onClick,
    replace,
    required
}: {
    onClick?: (symbol: SelectSymbolType) => void,
    replace?: boolean
    required?: boolean
} = { replace: false, required: false }) {
    const refInput = useRef<HTMLInputElement>(null)
    const [resultSymbols, setResultSymbols] = useState<SelectSymbolType[]>([])
    const [debouncedValue, setValue] = useDebounceValue("", 750)

    const [, setLoading] = useState(false)

    useEffect(() => {
        if (!debouncedValue) {
            setResultSymbols([])
            return
        }

        setLoading(true)

        fetch(`/api/search/symbol?search=${debouncedValue}`)
            .then(response => response.json())
            .then(data => {
                setResultSymbols(data.symbols as SelectSymbolType[])
                setLoading(false)
            })

    }, [debouncedValue])

    return (
        <div className="relative">
            <Label htmlFor="symbol">Symbole</Label>
            <Input
                id="symbol"
                name="symbol"
                ref={refInput}
                type="text"
                placeholder="Rechercher un symbole"
                onChange={event => setValue(event.target.value)}
                required={required}
            />

            {resultSymbols && resultSymbols.length > 0 ? (
                <Card className="absolute left-0 top-full z-10 mt-1 h-32 w-full overflow-x-hidden overflow-y-scroll">
                    {resultSymbols.map((symbol, i) => (
                        <Button
                            variant="outline"
                            key={normalizeSymbol(symbol.symbol) + "-" + i}
                            onClick={() => {
                                if (refInput.current && !replace) refInput.current.value = ""

                                if (refInput.current && replace) {
                                    console.log("replace", symbol)
                                 
                                    refInput.current.value = `${normalizeSymbol(symbol.description)} (${normalizeSymbol(symbol.symbol)})`
                                }

                                setValue("")
                                setResultSymbols([])

                                if (onClick !== undefined) onClick(symbol)
                            }}
                            className="flex w-full flex-row items-center justify-between border-none p-2"
                        >
                            <p>{normalizeSymbol(symbol.description)} ({normalizeSymbol(symbol.symbol)})</p>

                            <p>{symbol.exchange}</p>
                        </Button>
                    ))}
                </Card>
            ) : null}
        </div>
    )

}

export default function SelectSymbol({
    selectedSymbol,
    setSelectedSymbol
}: {
    selectedSymbol: SelectSymbolType[]
    setSelectedSymbol: Dispatch<SetStateAction<SelectSymbolType[]>>
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-row flex-wrap gap-2">
                {selectedSymbol.map((symbol, i) => (
                    <Badge key={normalizeSymbol(symbol.symbol) + "-" + i}>
                        {normalizeSymbol(symbol.description)} ({normalizeSymbol(symbol.symbol)})

                        <button
                            className="ml-2 flex h-8 flex-row items-center justify-center"
                            onClick={() => setSelectedSymbol((prev) => prev.filter((s) => s !== symbol))}
                        >
                            <MdDelete />
                        </button>
                    </Badge>
                ))}
            </div>

            <SearchSymbol 
                onClick={(symbol) => setSelectedSymbol((prev) => [...prev, symbol])}
            />
        </div>

    )
}

export type { SelectSymbolType }