import type { LoaderFunction } from "@remix-run/node"
import { fetchSymbol } from "../../../../../utils/tradingview/request"
import { reverseNormalizeSymbol } from "../../../../../utils/normalizeSymbol"
import getPrices, { closeClient } from "../../../../../utils/getPrices"
import { subDays, subMonths, subYears } from "date-fns"
import currencies from "../../../../../../lang/currencies"

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

    const timeframeMap: Record<string, {
		timeframe: [string, number],
		from: Date | number,
	}> = {
        "1D": {
			timeframe: ["1", 360],
			from: subDays(new Date(), 1)
		},
		"1W": {
			timeframe: ["60", 168],
			from: subDays(new Date(), 7)
		},
        "1M": {
			timeframe: ["60", 1860],
			from: subMonths(new Date(), 1)
		},
        "1Y": {
			timeframe: ["1D", 365],
			from: subYears(new Date(), 1)
		},
		"5Y": {
			timeframe: ["1D", 1825],
			from: subYears(new Date(), 5)
		},
        "all": {
			timeframe: ["1M", 1200],
			from: -Number.MAX_SAFE_INTEGER
		}
    }

	const timeframe = timeframeMap[timeframeParams] || timeframeMap["1D"]
    const [timeframePrice, range] = timeframe.timeframe

	const { period: prices, periodInfo } = await getPrices(symbol, {
		timeframe: timeframePrice,
		range: range
	})

	closeClient()
	
	// Remove price that are not in the from range
	const pricesFiltered = prices.filter((price) => {
		return new Date(price.time * 1000) >= timeframe.from
	})

	const prettyCurrency = currencies[periodInfo.currency_code]?.symbol_native ?? periodInfo.currency_code

	return {
		error: false,
		success: true,
		message: "Data fetched successfully",
		prices: pricesFiltered.reverse(),
        timeframe: timeframeMap[timeframeParams] ? timeframeParams : "1D",
		prettyCurrency: prettyCurrency
        // timeframe: timeframe,
        // range: range
	}
}
