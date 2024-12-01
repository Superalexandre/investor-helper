import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { MdDelete } from "react-icons/md"
import { useDebounceValue, useOnClickOutside } from "usehooks-ts"
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
	// biome-ignore lint/style/useNamingConvention: <explanation>
	currency_code: string
	prefix?: string
}

type SearchType = "all" | "allSymbol" | "stocks" | "crypto" | "news"

export function SearchSymbol({
	onClick,
	replace = false,
	required = false,
	placeholder = "Rechercher un symbole",
	displayLabel = true,
	resultSize = "h-32",
	idInput = "symbol"
}: {
	onClick?: (symbol: SelectSymbolType) => void
	onBlur?: "none" | "hidden" | "clear"
	onFocus?: "none" | "hidden"
	replace?: boolean
	required?: boolean
	placeholder?: string
	displayLabel?: boolean
	resultSize?: string
	searching?: SearchType[]
	idInput?: string
}) {
	const refInput = useRef<HTMLInputElement>(null)
	const refContainer = useRef<HTMLDivElement>(null)

	const [resultSymbols, setResultSymbols] = useState<SelectSymbolType[]>([])

	const [debouncedValue, setValue] = useDebounceValue("", 750)
	const [hidden, setHidden] = useState(true)

	const [, setLoading] = useState(false)

	useOnClickOutside(refContainer, () => setHidden(true))

	useEffect(() => {
		if (!debouncedValue) {
			setResultSymbols([])
			setHidden(true)

			return
		}

		setLoading(true)

		fetch(`/api/search?search=${debouncedValue}&searching=allSymbol`)
			.then((response) => response.json())
			.then((data) => {
				setResultSymbols(data.symbols as SelectSymbolType[])

				setLoading(false)
				setHidden(false)
			})
	}, [debouncedValue])

	const addSymbol = (symbol: SelectSymbolType) => {
		if (refInput.current && !replace) {
			refInput.current.value = ""
		}

		if (refInput.current && replace) {
			refInput.current.value = `${normalizeSymbolHtml(symbol.description)} (${normalizeSymbolHtml(symbol.symbol)})`
		}

		setValue("")
		setResultSymbols([])
		setHidden(true)

		if (onClick !== undefined) {
			onClick(symbol)
		}
	}

	return (
		<div className="relative w-full" ref={refContainer}>
			{displayLabel ? <Label htmlFor="symbol">Symbole</Label> : null}
			<Input
				className="w-full"
				id={idInput}
				name="symbol"
				ref={refInput}
				type="text"
				placeholder={placeholder}
				onChange={(event) => setValue(event.target.value)}
				required={required}
			/>

			{hidden ? null : (
				<div className="absolute top-full left-0 z-10 mt-1 flex w-full flex-col gap-1 overflow-x-hidden overflow-y-scroll">
					<Card className={cn(resultSize, hidden ? "hidden" : "block")}>
						{resultSymbols.length > 0
							? resultSymbols.map((symbol, i) => (
									<Button
										variant="outline"
										key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}
										onClick={() => addSymbol(symbol)}
										className="flex w-full flex-row items-center justify-between border-none p-2"
									>
										<p>
											{normalizeSymbolHtml(symbol.description)} (
											{normalizeSymbolHtml(symbol.symbol)})
										</p>

										<p>{symbol.exchange}</p>
									</Button>
								))
							: null}
					</Card>
				</div>
			)}
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
					<Badge key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}>
						{normalizeSymbolHtml(symbol.description)} ({normalizeSymbolHtml(symbol.symbol)})
						<button
							type="button"
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
					const normalizedSymbol = {
						...symbol,
						description: normalizeSymbolHtml(symbol.description),
						symbol: normalizeSymbolHtml(symbol.symbol)
					}

					setSelectedSymbol((prev) => [...prev, normalizedSymbol])
				}}
			/>
		</div>
	)
}

export type { SelectSymbolType }
