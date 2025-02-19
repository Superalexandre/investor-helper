import type { LoaderFunction } from "@remix-run/node"
import getPrices, { closeClient, type Period } from "../../../../../utils/getPrices"
import { subDays, subMonths, subYears } from "date-fns"
import currencies from "../../../../../../lang/currencies"
import logger from "../../../../../../log"

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	const symbol = url.searchParams.get("symbol")
	const timeframeParams = url.searchParams.get("timeframe")

	if (!symbol || !timeframeParams) {
		return {
			error: true,
			success: false,
			message: "Symbol or timeframe not found"
		}
	}

	const currentDate = new Date()
	currentDate.setMinutes(0, 0, 0)

	const timeframeMap: Record<
		string,
		{
			timeframe: [string, number]
			from: Date | number
		}
	> = {
		"1D": {
			timeframe: ["1", 360],
			// from: subDays(new Date(), 1)
			from: subDays(currentDate, 1)
		},
		"1W": {
			timeframe: ["60", 168],
			// from: subDays(new Date(), 7)
			from: subDays(currentDate, 7)
		},
		"1M": {
			timeframe: ["60", 1860],
			// from: subMonths(new Date(), 1)
			from: subMonths(currentDate, 1)
		},
		"1Y": {
			timeframe: ["1D", 365],
			// from: subYears(new Date(), 1)
			from: subYears(currentDate, 1)
		},
		"5Y": {
			timeframe: ["1D", 1825],
			// from: subYears(new Date(), 5)
			from: subYears(currentDate, 5)
		},
		all: {
			timeframe: ["1M", 1200],
			// from: -Number.MAX_SAFE_INTEGER
			from: 0
		}
	}

	const timeframe = timeframeMap[timeframeParams] || timeframeMap["1D"]
	const [timeframePrice, range] = timeframe.timeframe

	const { period: prices, periodInfo, clientId } = await getPrices(symbol, {
		timeframe: timeframePrice,
		range: range
	})

	closeClient({ clientId })

	if (!prices) {
		return {
			error: true,
			success: false,
			message: "Symbol not found"
		}
	}

	// Check if there is an anormal volume exchange
	const volume = prices.map((price) => price.volume)
	const maxVolume = Math.max(...volume)
	const minVolume = Math.min(...volume)
	const volumeRange = maxVolume - minVolume
	const volumeAverage = volume.reduce((a, b) => a + b) / volume.length
	const highVolume = volumeRange > volumeAverage * 2

	// check if its weekend
	const day = new Date().getDay()
	const isWeekend = day === 0 || day === 6

	// Remove price that are not in the from range
	let pricesFiltered: Period[] = []

	if (periodInfo.type === "crypto") {
		pricesFiltered = prices
	} else {
		let timeframeFrom = timeframe.from

		if (isWeekend) {
			timeframeFrom = subDays(timeframe.from, day === 0 ? 2 : 1)
		}

		pricesFiltered = prices.filter((price) => {
			return new Date(price.time * 1000) >= timeframeFrom
		})

		if (pricesFiltered.length <= 1) {
			logger.warn(`No prices found for ${symbol} in the timeframe ${timeframeParams || "1D"}`)
			
			pricesFiltered = prices
		}

		// console.log("pricesFiltered", pricesFiltered, prices)
	}
	
	const prettyCurrency = currencies[periodInfo.currency_code]?.symbol_native ?? periodInfo.currency_code

	return {
		error: false,
		success: true,
		message: "Data fetched successfully",
		prices: pricesFiltered.reverse(),
		timeframe: timeframeMap[timeframeParams] ? timeframeParams : "1D",
		prettyCurrency: prettyCurrency,
		highVolume: highVolume,
		// timeframe: timeframe,
		// range: range
	}
}
