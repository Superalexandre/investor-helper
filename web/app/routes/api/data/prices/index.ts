import { json } from "@tanstack/start"
import { createAPIFileRoute } from "@tanstack/start/api"
import getPrices, { closeClient, type Period } from "../../../../../utils/getPrices"
import { subDays, subMonths, subYears } from "date-fns"
import currencies from "../../../../../../lang/currencies"
import logger from "../../../../../../log"

export const APIRoute = createAPIFileRoute("/api/data/prices")({
	GET: async ({ request }) => {
		const url = new URL(request.url)
		const symbol = url.searchParams.get("symbol")
		const timeframeParams = url.searchParams.get("timeframe")

		if (!symbol || !timeframeParams) {
			return json(
				{
					error: true,
					success: false,
					message: "Symbol or timeframe not found"
				},
				{ status: 404 }
			)
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
				from: subDays(currentDate, 1)
			},
			"1W": {
				timeframe: ["60", 168],
				from: subDays(currentDate, 7)
			},
			"1M": {
				timeframe: ["60", 1860],
				from: subMonths(currentDate, 1)
			},
			"1Y": {
				timeframe: ["1D", 365],
				from: subYears(currentDate, 1)
			},
			"5Y": {
				timeframe: ["1D", 1825],
				from: subYears(currentDate, 5)
			},
			all: {
				timeframe: ["1M", 1200],
				from: 0
			}
		}

		const timeframe = timeframeMap[timeframeParams] || timeframeMap["1D"]
		const [timeframePrice, range] = timeframe.timeframe

		const {
			period: prices,
			periodInfo,
			clientId
		} = await getPrices(symbol, {
			timeframe: timeframePrice,
			range: range
		})

		closeClient({ clientId })

		if (!prices) {
			return json(
				{
					error: true,
					success: false,
					message: "Symbol not found"
				},
				{ status: 404 }
			)
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
		}

		const prettyCurrency = currencies[periodInfo.currency_code]?.symbol_native ?? periodInfo.currency_code

		return json({
			error: false,
			success: true,
			message: "Data fetched successfully",
			prices: pricesFiltered.reverse(),
			timeframe: timeframeMap[timeframeParams] ? timeframeParams : "1D",
			prettyCurrency: prettyCurrency,
			highVolume: highVolume
		})
	}
})
