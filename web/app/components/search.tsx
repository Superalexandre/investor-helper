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
import type { News } from "@/schema/news"
import { useNavigate } from "@remix-run/react"

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this component
export function Search({
	onClick,
	// onBlur = "none",
	// onFocus = "none",
	replace = false,
	required = false,
	placeholder = "Rechercher un symbole",
	displayLabel = true,
	resultSize = "h-32",
	searching = ["allSymbol"],
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
	const navigate = useNavigate()

	const refInput = useRef<HTMLInputElement>(null)
	const refContainer = useRef<HTMLDivElement>(null)

	const [resultSymbols, setResultSymbols] = useState<SelectSymbolType[]>([])
	const [resultNews, setResultNews] = useState<News[]>([])

	const [debouncedValue, setValue] = useDebounceValue("", 750)
	const [hidden, setHidden] = useState(true)
	const [searchingIn, setSearchingIn] = useState<SearchType>(searching[0])

	const [, setLoading] = useState(false)

	useOnClickOutside(refContainer, () => setHidden(true))

	useEffect(() => {
		if (!debouncedValue) {
			setResultSymbols([])
			setResultNews([])
			setHidden(true)

			return
		}

		setLoading(true)

		fetch(`/api/search?search=${debouncedValue}&searching=${searchingIn}`)
			.then((response) => response.json())
			.then((data) => {
				setResultSymbols(data.symbols as SelectSymbolType[])
				setResultNews(data.news as News[])

				setLoading(false)
				setHidden(false)
			})
	}, [debouncedValue, searchingIn])

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
					{searching.length > 1 ? (
						<div className="flex flex-row items-center gap-1">
							<Button
								variant={searchingIn === "all" ? "default" : "outline"}
								onClick={() => setSearchingIn("all")}
							>
								Tout
							</Button>

							<Button
								variant={searchingIn === "news" ? "default" : "outline"}
								onClick={() => setSearchingIn("news")}
							>
								News
							</Button>

							<Button
								variant={searchingIn === "allSymbol" ? "default" : "outline"}
								onClick={() => setSearchingIn("allSymbol")}
							>
								Tous les symboles
							</Button>

							<Button
								variant={searchingIn === "stocks" ? "default" : "outline"}
								onClick={() => setSearchingIn("stocks")}
							>
								Actions
							</Button>

							<Button
								variant={searchingIn === "crypto" ? "default" : "outline"}
								onClick={() => setSearchingIn("crypto")}
							>
								Crypto
							</Button>
						</div>
					) : null}

					<Card className={cn(resultSize, hidden ? "hidden" : "block")}>
						{resultNews.length > 0
							? resultNews.map((news) => (
									<Button
										variant="outline"
										key={news.id}
										onClick={() => {
											navigate(`/news/${news.id}`)

											setHidden(true)
											setValue("")
											setResultNews([])
											setResultSymbols([])

											if (refInput.current?.value) {
												refInput.current.value = ""
											}
										}}
										className="flex w-full flex-row items-center justify-between border-none p-2"
									>
										<p>{news.title}</p>
									</Button>
								))
							: null}

						{resultSymbols.length > 0
							? resultSymbols.map((symbol, i) => (
									<Button
										variant="outline"
										key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}
										// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this component
										onClick={() => {
											if (refInput.current && !replace) {
												refInput.current.value = ""
											}

											if (refInput.current && replace) {
												refInput.current.value = `${normalizeSymbolHtml(symbol.description)} (${normalizeSymbolHtml(symbol.symbol)})`
											}

											setValue("")
											setResultSymbols([])
											setResultNews([])
											setHidden(true)

											if (onClick !== undefined) {
												onClick(symbol)
											}
										}}
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

			<Search
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
