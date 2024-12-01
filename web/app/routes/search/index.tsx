import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type RefObject, useRef, useState } from "react"
import { useDebounceValue } from "@/hooks/useDebounceValue"
import { cn } from "@/lib/utils"
import { normalizeSymbol, normalizeSymbolHtml } from "@/utils/normalizeSymbol"
import type { News } from "@/schema/news"
import { Link, useLocation, useNavigate } from "@remix-run/react"
import { MdClose } from "react-icons/md"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "../../components/ui/skeleton"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import i18next from "../../i18next.server"
import type { Events } from "../../../../db/schema/events"

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

type SearchType = "all" | "allSymbol" | "stocks" | "crypto" | "news" | "events"

export async function loader({ request }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "search")

	const title = t("title")
	const description = t("description")

	return {
		title: title,
		description: description
	}
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return []
	}

	const { title, description } = data

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://www.investor-helper.com/search" }
	]
}

export const handle = {
	i18n: "search"
}

export default function Index() {
	const { t } = useTranslation("search")
	const location = useLocation()
	const pathname = location.pathname
	const navigate = useNavigate()
	const inputRef = useRef<HTMLInputElement>(null)

	const { searchParam, searchInParam } = getSearchParams(location)
	const [debouncedValue, setDebouncedValue, setForceValue] = useDebounceValue(searchParam ?? "", 750)
	const [searchingIn, setSearchingIn] = useState<SearchType>((searchInParam as SearchType) ?? "all")

	useInvalidSearchParamRedirect(searchInParam, searchParam, pathname, navigate)

	const { data, isPending, error } = useSearchQuery(debouncedValue, searchingIn, pathname, navigate)

	const hidden = !debouncedValue || isPending || error

	if (error) {
		throw error
	}

	return (
		<div className="flex flex-col items-center justify-center p-4">
			<div className="relative w-full">
				<SearchInput
					inputRef={inputRef}
					setDebouncedValue={setDebouncedValue}
					searchParam={searchParam}
					hidden={!!hidden}
					setForceValue={setForceValue}
					t={t}
				/>

				{hidden ? null : (
					<div className="absolute top-full left-0 z-10 mt-2 flex w-full flex-col gap-1 overflow-x-hidden">
						<Filter searchingIn={searchingIn} setSearchingIn={setSearchingIn} t={t} />

						<div className={cn(hidden ? "hidden" : "flex flex-col")}>
							{!isPending && data.news.length > 0 ? <DisplayNews news={data.news} /> : null}

							{!isPending && data.symbols.length > 0 ? <DisplaySymbols symbols={data.symbols} /> : null}

							{!isPending && data.events.length > 0 ? <DisplayEvents events={data.events} /> : null}
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

function getSearchParams(location: ReturnType<typeof useLocation>) {
	const searchParams = new URLSearchParams(location.search)
	const searchParam = searchParams.get("search")
	const searchInParam = searchParams.get("searching")
	return { searchParam, searchInParam }
}

function useInvalidSearchParamRedirect(
	searchInParam: string | null,
	searchParam: string | null,
	pathname: string,
	navigate: ReturnType<typeof useNavigate>
) {
	const validParams = ["all", "allSymbol", "stocks", "crypto", "news", "events"]
	if (searchInParam && !validParams.includes(searchInParam)) {
		let url = pathname

		if (searchParam) {
			url += `?search=${searchParam}&searching=all`
		} else {
			url += "?searching=all"
		}

		navigate(url)
	}
}

function useSearchQuery(
	debouncedValue: string,
	searchingIn: SearchType,
	pathname: string,
	navigate: ReturnType<typeof useNavigate>
) {
	return useQuery<{ symbols: SelectSymbolType[]; news: News[]; events: Events[] }>({
		queryKey: ["search", debouncedValue, searchingIn],
		queryFn: async () => {
			console.log("searching", debouncedValue, searchingIn)

			if (!debouncedValue) {
				navigate(pathname)

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
		refetchOnWindowFocus: true
	})
}

function SearchInput({
	inputRef,
	setDebouncedValue,
	searchParam,
	hidden,
	setForceValue,
	t
}: {
	inputRef: RefObject<HTMLInputElement>
	setDebouncedValue: (value: string) => void
	searchParam: string | null
	hidden: boolean
	setForceValue: (value: string) => void
	t: TFunction
}) {
	return (
		<div className="flex w-full flex-row items-center gap-2">
			<div className="relative w-full">
				<Input
					className="w-full"
					name="symbol"
					type="text"
					placeholder={t("placeholder")}
					onChange={(event) => setDebouncedValue(event.target.value)}
					defaultValue={searchParam ?? ""}
					ref={inputRef}
					required={true}
					autoFocus={true}
				/>

				{hidden ? null : (
					<Button
						variant="ghost"
						onClick={() => {
							if (inputRef.current) {
								inputRef.current.value = ""
							}

							setForceValue("")
						}}
						className="absolute top-0 right-0"
					>
						<MdClose className="size-6" />
					</Button>
				)}
			</div>
		</div>
	)
}

function Filter({
	searchingIn,
	setSearchingIn,
	t
}: {
	searchingIn: SearchType
	setSearchingIn: (searchingIn: SearchType) => void
	t: TFunction
}) {
	return (
		<div className="flex flex-row items-center gap-1 overflow-x-auto">
			{/* <Button className="flex flex-row items-center justify-center gap-2" variant="outline">
				<MdTune className="size-6" />
			
				<span className="hidden lg:block">Filter</span>
			</Button> */}

			<Button variant={searchingIn === "all" ? "default" : "outline"} onClick={() => setSearchingIn("all")}>
				{t("filters.all")}
			</Button>

			<Button variant={searchingIn === "news" ? "default" : "outline"} onClick={() => setSearchingIn("news")}>
				{t("filters.news")}
			</Button>

			<Button variant={searchingIn === "events" ? "default" : "outline"} onClick={() => setSearchingIn("events")}>
				Event
			</Button>

			<Button
				variant={searchingIn === "allSymbol" ? "default" : "outline"}
				onClick={() => setSearchingIn("allSymbol")}
			>
				{t("filters.allSymbols")}
			</Button>

			<Button variant={searchingIn === "stocks" ? "default" : "outline"} onClick={() => setSearchingIn("stocks")}>
				{t("filters.stocks")}
			</Button>

			<Button variant={searchingIn === "crypto" ? "default" : "outline"} onClick={() => setSearchingIn("crypto")}>
				{t("filters.cryptos")}
			</Button>
		</div>
	)
}

function DisplaySymbols({ symbols }: { symbols: SelectSymbolType[] }) {
	return (
		<div className="flex flex-col gap-1">
			{symbols.map((symbol, i) => {
				const prefix = symbol.prefix?.toUpperCase() ?? symbol.exchange.toUpperCase()
				const normalizedSymbol = normalizeSymbolHtml(symbol.symbol)

				const fullUrl = normalizeSymbol(`${prefix}:${normalizedSymbol}`)

				return (
					<Link
						to={`/data/${fullUrl}`}
						state={{
							redirect: "/search",
							search: `?search=${normalizedSymbol}`
						}}
						key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}
					>
						<Button
							variant="outline"
							key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}
							className="flex w-full flex-row items-center justify-between border-none p-2"
						>
							<p className="overflow-hidden">
								{normalizeSymbolHtml(symbol.description)} ({normalizeSymbolHtml(symbol.symbol)})
							</p>

							<p className="pl-10">{symbol.exchange}</p>
						</Button>
					</Link>
				)
			})}
		</div>
	)
}

function DisplayNews({ news }: { news: News[] }) {
	return (
		<div className="flex flex-col gap-1">
			{news.map((news) => (
				<Link to={`/news/${news.id}`} key={news.id}>
					<Button
						variant="outline"
						key={news.id}
						className="flex w-full flex-row items-center justify-between border-none p-2 "
					>
						<p className="overflow-hidden">{news.title}</p>
						<p className="pl-10">{news.source}</p>
					</Button>
				</Link>
			))}
		</div>
	)
}

function DisplayEvents({ events }: { events: Events[] }) {
	return (
		<div className="flex flex-col gap-1">
			{events.map((event) => (
				<Link to={`/events/${event.id}`} key={event.id}>
					<Button
						variant="outline"
						key={event.id}
						className="flex w-full flex-row items-center justify-between border-none p-2 "
					>
						<p className="overflow-hidden">{event.title}</p>
						<p className="pl-10">{event.source}</p>
					</Button>
				</Link>
			))}
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
