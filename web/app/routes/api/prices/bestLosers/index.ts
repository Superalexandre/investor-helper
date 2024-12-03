import type { BestLoser } from "../../../../../types/Prices"
import getPrices, { closeClient, type Period } from "../../../../../utils/getPrices"
import { fetchData } from "../../../../../utils/tradingview/request";
import { columns, filter } from "../parameters";
import { v4 as uuidv4 } from "uuid"

const cachedPrice = new Map<string, { prices: Period[]; lastUpdate: number }>()
const CACHE_TIME = 1000 * 60 * 60 // 1 hour

export async function loader() {
	const country = "france"

	const { parsedResult } = await fetchData({
		country: country,
		columns: columns,
		filter: filter,
		sort: {
			sortBy: "change",
			sortOrder: "asc"
		}
	})

	if (!parsedResult) {
		return {
			result: []
		}
	}

	const result: BestLoser[] = []
	const toFetch: string[] = []

	for (const item of parsedResult) {
		const symbol = item.symbol as string

		if (cachedPrice.has(symbol)) {
			const cached = cachedPrice.get(symbol)

			if (!cached) {
				toFetch.push(symbol)
				continue
			}

			if (Date.now() - cached.lastUpdate < CACHE_TIME) {
				result.push({
					...item,
					prices: cached.prices
				})
				continue
			}

			toFetch.push(symbol)
		} else {
			toFetch.push(symbol)
		}
	}

	console.log("toFetch (losers)", toFetch)

	await Promise.all(
		toFetch.map(async (symbol) => {
			const prices = await getPrices(symbol, {
				range: 360,
				timeframe: "1"
			})

			const reversed = prices.period.reverse()

			cachedPrice.set(symbol, { prices: reversed, lastUpdate: Date.now() })

			const item = parsedResult.find((item) => item.symbol === symbol)

			if (item) {
				result.push({
					...item,
					prices: reversed
				})
			}
		})
	)

	if (toFetch.length > 0) {
		closeClient()
	}

	return {
		result: result
	}
}
