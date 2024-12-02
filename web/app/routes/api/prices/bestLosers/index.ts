import type { BestGainer } from "../../../../../types/Prices"
import getPrices, { closeClient, type Period } from "../../../../../utils/getPrices"
import { columns, filter } from "../parameters";

const cachedPrice = new Map<string, { prices: Period[]; lastUpdate: number }>()
const CACHE_TIME = 1000 * 60 * 60 // 1 hour

export async function loader() {
	const country = "france"

	const url = `https://scanner.tradingview.com/${country}/scan?label-product=screener-stock`
	const request = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			columns,
			filter2: filter,
			// biome-ignore lint/style/useNamingConvention: <explanation>
			ignore_unknown_fields: false,
			options: {
				lang: "fr"
			},
			range: [0, 20],
			sort: {
				sortBy: "change",
				sortOrder: "asc"
			},
			symbols: {},
			markets: [country]
		})
	})

	if (!request.ok) {
		console.error("Failed to fetch best loosers", request.statusText)

		return null
	}

	const result = await request.json()

	console.log("result : ", result)

	const parsedResult: BestGainer[] = []
	const toFetch: string[] = []

	for (const item of result.data) {
		const reducedItem = columns.reduce((acc, key, index) => {
			acc[key] = item.d[index]
			return acc
		}, {} as BestGainer)

		reducedItem.symbol = item.s

		if (cachedPrice.has(reducedItem.symbol)) {
			const cached = cachedPrice.get(reducedItem.symbol)

			if (!cached) {
				toFetch.push(reducedItem.symbol)
				continue
			}

			if (Date.now() - cached.lastUpdate < CACHE_TIME) {
				reducedItem.prices = cached.prices
				parsedResult.push(reducedItem)
				continue
			}

            toFetch.push(reducedItem.symbol)
		} else {
			toFetch.push(reducedItem.symbol)
		}

		parsedResult.push(reducedItem)
	}

	// console.log("items : ", parsedResult.length)

	console.log("toFetch : ", toFetch)

	await Promise.all(
		toFetch.map(async (symbol) => {
			const prices = await getPrices(symbol, {
				// 1-360
				range: 360,
				timeframe: "1"
			})
			const reversed = prices.period.reverse()

			cachedPrice.set(symbol, { prices: reversed, lastUpdate: Date.now() })

			const item = parsedResult.find((item) => item.symbol === symbol)

			if (item) {
				item.prices = reversed
			}
		})
	)

	// console.log(parsedResult)

	closeClient()

	return {
		result: parsedResult
	}
}
