import logger from "../../../../../../log"
import type { BestLoser } from "../../../../../types/Prices"
import getPrices, { closeClient, type Period } from "../../../../../utils/getPrices"
import { fetchData } from "../../../../../utils/tradingview/request"
import { columns, filter } from "../parameters"

const cachedPrice = new Map<string, { prices: Period[]; lastUpdate: number }>()
const CACHE_TIME = 1000 * 60 * 60 // 1 hour

export async function loader() {
	const country = "france"

	const startFetch = Date.now()
	const { parsedResult } = await fetchData({
		country: country,
		columns: columns,
		filter: filter,
		sort: {
			sortBy: "change",
			sortOrder: "asc"
		},
		range: [0, 20]
	})

	if (!parsedResult) {
		return {
			result: []
		}
	}
	const endFetch = Date.now()

	const result: BestLoser[] = []
	const toFetch: string[] = []

	const startParsing = Date.now()
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
	const endParsing = Date.now()

	if (toFetch.length === 0) {
		logger.info("bestLosers: no need to fetch prices")

		return {
			result: result
		}
	}

	const startPrices = Date.now()

	logger.info(`toFetch (losers) ${toFetch.join(", ")}`)
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
	const endPrices = Date.now()

	if (toFetch.length > 0) {
		closeClient()
	}

	logger.info({
		level: "info",
		message: `Losers times, fetch time: ${endFetch - startFetch}ms, parsing time: ${endParsing - startParsing}ms, prices time: ${endPrices - startPrices}ms, total time: ${endPrices - startFetch}ms`,
		data: {
			toFetch: toFetch,
			fetchTime: endFetch - startFetch,
			parsingTime: endParsing - startParsing,
			pricesTime: endPrices - startPrices,
			totalTime: endPrices - startFetch
		}
	})

	return {
		result: result
	}
}
