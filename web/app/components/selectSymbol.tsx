import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { MdDelete } from "react-icons/md"
import { useDebounceValue } from "usehooks-ts"
import { Label } from "./ui/label"
import { cn } from "@/lib/utils"
import { normalizeSymbolHtml } from "@/utils/normalizeSymbol"

interface SelectSymbolType {
    symbol: string
    description: string
    exchange: string
    logoid: string
    price: number
    quantity: number
    currency_code: string
    prefix?: string
}

export function SearchSymbol({
    onClick,
    // onBlur = "none",
    // onFocus = "none",
    replace = false,
    required = false,
    placeholder = "Rechercher un symbole",
    displayLabel = true,
    resultSize = "h-32"
}: {
    onClick?: (symbol: SelectSymbolType) => void,
    onBlur?: "none" | "hidden" | "clear",
    onFocus?: "none" | "hidden",
    replace?: boolean
    required?: boolean
    placeholder?: string,
    displayLabel?: boolean
    resultSize?: string
}) {
    const refInput = useRef<HTMLInputElement>(null)
    const [resultSymbols, setResultSymbols] = useState<SelectSymbolType[]>([])
    const [debouncedValue, setValue] = useDebounceValue("", 750)
    const [hidden, setHidden] = useState(true)

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
                setHidden(false)
            })

    }, [debouncedValue])

    return (
        <div className="relative w-full"
        >
            {displayLabel ? <Label htmlFor="symbol">Symbole</Label> : null}
            <Input
                className="w-full"
                id="symbol"
                name="symbol"
                ref={refInput}
                type="text"
                placeholder={placeholder}
                onChange={event => setValue(event.target.value)}
                required={required}
                // onBlur={() => {
                //     if (onBlur === "hidden") setHidden(true)

                //     if (onBlur === "clear") setValue("")

                //     if (onBlur === "none") return
                // }}
                // onFocus={() => {
                //     if (onFocus === "hidden") setHidden(false)

                //     if (onFocus === "none") return
                // }}
            />

            {resultSymbols && resultSymbols.length > 0 ? (
                <Card className={cn("absolute left-0 top-full z-10 mt-1 w-full overflow-x-hidden overflow-y-scroll", resultSize, hidden ? "hidden" : "block")}>
                    {resultSymbols.map((symbol, i) => (
                        <Button
                            variant="outline"
                            key={normalizeSymbolHtml(symbol.symbol) + "-" + i}
                            onClick={() => {
                                if (refInput.current && !replace) refInput.current.value = ""

                                if (refInput.current && replace) {
                                    refInput.current.value = `${normalizeSymbolHtml(symbol.description)} (${normalizeSymbolHtml(symbol.symbol)})`
                                }

                                setValue("")
                                setResultSymbols([])

                                if (onClick !== undefined) onClick(symbol)
                            }}
                            className="flex w-full flex-row items-center justify-between border-none p-2"
                        >
                            <p>{normalizeSymbolHtml(symbol.description)} ({normalizeSymbolHtml(symbol.symbol)})</p>

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
                    <Badge key={normalizeSymbolHtml(symbol.symbol) + "-" + i}>
                        {normalizeSymbolHtml(symbol.description)} ({normalizeSymbolHtml(symbol.symbol)})

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
                onClick={(symbol) => {
                    symbol = {
                        ...symbol,
                        description: normalizeSymbolHtml(symbol.description),
                        symbol: normalizeSymbolHtml(symbol.symbol)
                    }

                    setSelectedSymbol((prev) => [...prev, symbol])
                }}
            />
        </div>

    )
}

export type { SelectSymbolType }