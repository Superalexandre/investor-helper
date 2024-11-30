import { searchNews } from "@/utils/news"
import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"
import type { News } from "../../../../../db/schema/news"
import type { RawSearchResult } from "../../../../types/Search"
import type { Events } from "../../../../../db/schema/events"
import { searchEvents } from "../../../../utils/events"

export async function searchSymbol(search: string, searching = "undefined") {
	const url = new URL(
		// biome-ignore lint/nursery/noSecrets: URL
		"https://symbol-search.tradingview.com/symbol_search/v3/"
	)

	url.searchParams.set("text", search)
	url.searchParams.set("hl", "1")
	url.searchParams.set("lang", "fr")
	url.searchParams.set("search_type", searching)
	url.searchParams.set("domain", "production")
	url.searchParams.set("sort_by_country", "FR")

	const res = await fetch(url, {
		headers: {
			accept: "application/json",
			"accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
			"content-type": "application/json",

			origin: "https://www.tradingview.com",
			referer: "https://www.tradingview.com/"
		}
	})

	const symbols = await res.json()

	return symbols
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)

	const search = url.searchParams.get("search")
	const searching = url.searchParams.get("searching")

	if (!search) {
		return {
			error: "Missing search parameter"
		}
	}

	const symbolsResult: RawSearchResult[] = []
	const newsResult: News[] = []
	const eventsResult: Events[] = []

	if (searching && ["allSymbol", "stocks", "crypto"].includes(searching)) {
		const symbols = await searchSymbol(search, searching === "allSymbol" ? "undefined" : searching)

		symbolsResult.push(...symbols.symbols)
	} else if (searching && ["news"].includes(searching)) {
		const news = await searchNews(search, -1)

		newsResult.push(...news)
	} else if (searching && ["all"].includes(searching)) {
		const symbols = await searchSymbol(search, "undefined")
		const news = await searchNews(search)
		const events = await searchEvents(search)

		newsResult.push(...news)
		symbolsResult.push(...symbols.symbols)
		eventsResult.push(...events)
	} else if (searching && ["events"].includes(searching)) {
		const events = await searchEvents(search, -1)

		eventsResult.push(...events)
	} else {
		console.error("Unknown searching parameter", searching)
	}

	return {
		symbols: symbolsResult,
		news: newsResult,
		events: eventsResult
	}
}
