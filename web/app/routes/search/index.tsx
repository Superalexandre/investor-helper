import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRef, useState } from "react"
import { useDebounceValue } from "usehooks-ts"
import { cn } from "@/lib/utils"
import { normalizeSymbol, normalizeSymbolHtml } from "@/utils/normalizeSymbol"
import type { News } from "@/schema/news"
import { Link, useLocation, useNavigate } from "@remix-run/react"
import { MdClose } from "react-icons/md"
import type { MetaFunction } from "@remix-run/node"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "../../components/ui/skeleton"

interface SelectSymbolType {
	symbol: string
	description: string
	exchange: string
	logoid: string
	price: number
	quantity: number
	// biome-ignore lint/style/useNamingConvention: API response
	currency_code: string
	prefix?: string
}

type SearchType = "all" | "allSymbol" | "stocks" | "crypto" | "news"

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Rechercher"
	const description =
		"Recherchez un symbole, une action, une crypto, une news sur Investor Helper. Trouvez rapidement les informations dont vous avez besoin pour vos investissements et vos analyses financières."

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://www.investor-helper.com/search" }
	]
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this component
export default function Index() {
	const location = useLocation()
	const pathname = location.pathname

	const navigate = useNavigate()

	const inputRef = useRef<HTMLInputElement>(null)

	const searchParams = new URLSearchParams(location.search)
	const searchParam = searchParams.get("search")
	const searchInParam = searchParams.get("searching")

	const validParams = ["all", "allSymbol", "stocks", "crypto", "news"]
	if (searchInParam && !validParams.includes(searchInParam)) {
		let url = pathname

		if (searchParam) {
			url += `?search=${searchParam}&searching=all`
		} else {
			url += "?searching=all"
		}

		navigate(url)
	}

	const [debouncedValue, setValue] = useDebounceValue(searchParam ?? "", 750)
	const [searchingIn, setSearchingIn] = useState<SearchType>((searchInParam as SearchType) ?? "all")

	const reset = () => {
		if (inputRef.current) {
			inputRef.current.value = ""
		}

		setValue("")

		navigate(pathname)
	}

	const { data, isPending, error } = useQuery<{ symbols: SelectSymbolType[]; news: News[] }>({
		queryKey: ["search", debouncedValue, searchingIn],
		queryFn: async () => {
			if (!debouncedValue) {
				reset()

				return {
					symbols: [],
					news: []
				}
			}

			navigate(`${pathname}?search=${debouncedValue}&searching=${searchingIn}`)

			const req = await fetch(`/api/search?search=${debouncedValue}&searching=${searchingIn}`)
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true,
	})

	const hidden = !debouncedValue || isPending || error

	if (error) {
		throw error
	}

	return (
		<div className="flex flex-col items-center justify-center p-4">
			<div className="relative w-full">
				<div>
					<Input
						className="w-full"
						name="symbol"
						type="text"
						placeholder="Rechercher un symbole, une action, une crypto, une news..."
						onChange={(event) => setValue(event.target.value)}
						defaultValue={searchParam ?? ""}
						ref={inputRef}
						required={true}
						autoFocus={true}
					/>

					{hidden ? null : (
						<Button variant="ghost" onClick={reset} className="absolute top-0 right-0">
							<MdClose className="size-6" />
						</Button>
					)}
				</div>

				{hidden ? null : (
					<div className="absolute top-full left-0 z-10 mt-1 flex w-full flex-col gap-1 overflow-x-hidden">
						<div className="flex flex-row items-center gap-1 overflow-x-auto">
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

						<div className={cn(hidden ? "hidden" : "flex flex-col")}>
							{!isPending && data.news.length > 0
								? data.news.map((news) => (
										<Link
											to={`/news/${news.id}`}
											state={{
												redirect: pathname,
												search: `?search=${debouncedValue}`
											}}
											key={news.id}
										>
											<Button
												variant="outline"
												key={news.id}
												className="flex w-full flex-row items-center justify-between border-none p-2 "
											>
												<p className="overflow-hidden">{news.title}</p>
												<p className="pl-10">{news.source}</p>
											</Button>
										</Link>
									))
								: null}

							{!isPending && data.symbols.length > 0
								? data.symbols.map((symbol, i) => {
										const prefix = symbol.prefix?.toUpperCase() ?? symbol.exchange.toUpperCase()
										const normalizedSymbol = normalizeSymbolHtml(symbol.symbol)

										const fullUrl = normalizeSymbol(`${prefix}:${normalizedSymbol}`)

										return (
											<Link
												to={`/data/${fullUrl}`}
												state={{
													redirect: pathname,
													search: `?search=${debouncedValue}`
												}}
												key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}
											>
												<Button
													variant="outline"
													key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}
													className="flex w-full flex-row items-center justify-between border-none p-2"
												>
													<p className="overflow-hidden">
														{normalizeSymbolHtml(symbol.description)} (
														{normalizeSymbolHtml(symbol.symbol)})
													</p>

													<p className="pl-10">{symbol.exchange}</p>
												</Button>
											</Link>
										)
									})
								: null}
						</div>
					</div>
				)}

				{isPending ? (
					<div className="mt-2">
						<div className="flex flex-col gap-2">
							{Array.from({ length: 50 }).map((_, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								<SkeletonSearch key={index} />
							))}
						</div>
					</div>
				) : null}
			</div>
		</div>
	)
}

function SkeletonSearch() {
	return (
		<div className="flex flex-row justify-between">
			<Skeleton className="h-6 w-6/12" />
			<Skeleton className="h-6 w-1/12" />
		</div>
	)
}

export type { SelectSymbolType }
