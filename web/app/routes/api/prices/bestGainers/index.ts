import logger from "../../../../../../log"
import type { BestGainer } from "../../../../../types/Prices"
import getPrices, { closeClient, formatPrices, type Period } from "../../../../../utils/getPrices"
import { fetchScreener } from "../../../../../utils/tradingview/request"
import { columns, filter } from "../parameters"

const cachedPrice = new Map<string, { prices: Period[]; lastUpdate: number }>()
const CACHE_TIME = 1000 * 60 * 60 // 1 hour

export async function loader() {
	const country = "france"

	const { parsedResult } = await fetchScreener({
		labelProduct: "screener-stock",
		country: country,
		columns: columns,
		filter: filter,
		sort: {
			sortBy: "change",
			sortOrder: "desc"
		},
		range: [0, 20]
	})

	if (!parsedResult) {
		return {
			result: []
		}
	}

	const result: BestGainer[] = []
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
				const rawChange = item.change.toString().replace(/\+|-/g, "")
				const rawChangeNumber = Number.parseFloat(rawChange)

				result.push({
					...item,
					rawChange: rawChangeNumber,
					prices: cached.prices
				})

				continue
			}

			toFetch.push(symbol)
		} else {
			toFetch.push(symbol)
		}
	}
	
	if (toFetch.length === 0) {
		logger.info("bestGainers: no need to fetch prices")

		return {
			result: result
		}
	}
	
	logger.info(`toFetch (gainers) ${toFetch.join(", ")}`)
	const clientId = Math.random().toString(36).substring(7)
	await Promise.all(
		toFetch.map(async (symbol) => {
			const prices = await getPrices(symbol, {
				range: 360,
				timeframe: "1",
				clientId: clientId
			})

			const reversed = formatPrices(prices.period).reverse()

			cachedPrice.set(symbol, { prices: reversed, lastUpdate: Date.now() })

			const item = parsedResult.find((item) => item.symbol === symbol)

			if (item) {
				const rawChange = item.change.toString().replace(/\+|-/g, "")
				const rawChangeNumber = Number.parseFloat(rawChange)

				result.push({
					...item,
					rawChange: rawChangeNumber,
					prices: reversed
				})
			}
		})
	)

	if (toFetch.length > 0) {
		closeClient({ clientId })
	}

	return {
		result: result
	}
}
