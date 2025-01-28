import type { LoaderFunction } from "@remix-run/node"
import getPrices, { closeClient, type Period } from "../../../../../../utils/getPrices"
import { subDays, subMonths, subYears } from "date-fns"
import { fetchSymbol } from "../../../../../../utils/tradingview/request"
// import currencies from "../../../../../../lang/currencies"

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	const symbolsParams = url.searchParams.get("symbols")
	const timeframeParams = url.searchParams.get("timeframe")

	if (!symbolsParams || !timeframeParams) {
		return {
			error: true,
			success: false,
			message: "Symbol or timeframe not found"
		}
	}

	const currentDate = new Date()
    currentDate.setMinutes(0, 0, 0)
	// currentDate.setMinutes(0)
	// currentDate.setSeconds(0)
	// currentDate.setMilliseconds(0)

	const timeframeMap: Record<
		string,
		{
			timeframe: [string, number]
			from: Date,
            interval: number,
            threshold: number
		}
	> = {
		"1D": {
			timeframe: ["1", 360],
			from: subDays(currentDate, 1),
            // 1 minute
            interval: 60000,
            // 30 minutes
            threshold: 1000 * 60 * 30
		},
		"1W": {
			timeframe: ["60", 168],
			from: subDays(currentDate, 7),
            // 1 heure
            interval: 3600000,
            // 1 heure
            threshold: 1000 * 60 * 60
		},
		"1M": {
			timeframe: ["60", 1860],
			from: subMonths(currentDate, 1),
            // 1 heure
            interval: 3600000,
            // 1 heure
            threshold: 1000 * 60 * 60
		},
		"1Y": {
			timeframe: ["1D", 365],
			from: subYears(currentDate, 1),
            // 1 jour
            interval: 86400000,
            // 1 jour
            threshold: 1000 * 60 * 60 * 24
		},
		"5Y": {
			timeframe: ["1D", 1825],
			from: subYears(currentDate, 5),
            // 1 jour
            interval: 86400000,
            // 1 jour
            threshold: 1000 * 60 * 60 * 24
		},
		// all: {
		// 	timeframe: ["1M", 1200],
		// 	from: -Number.MAX_SAFE_INTEGER,
        //     // 1 mois
        //     interval: 2592000000
		// }
	}

    const symbols = symbolsParams.split(",")
	const timeframe = timeframeMap[timeframeParams] || timeframeMap["1D"]
	const [timeframePrice, range] = timeframe.timeframe

	const interval = timeframe.interval

    const allPrices = new Map<string, { date: Date; [key: string]: number | Date }>();
    for (let date = timeframe.from; date < currentDate; date = new Date(date.getTime() + interval)) {
        allPrices.set(date.toISOString(), { date });
    }

    
    const pricePromises = symbols.map(async (symbol) => {
        const [priceResult, symbolData] = await Promise.all([
            getPrices(symbol, { timeframe: timeframePrice, range }),
            fetchSymbol({ language: "fr-FR", symbol, fields: "all" })
        ]).catch(error => {
            console.error(error);
            return [null, null];
        });

        if (!priceResult || !symbolData) return null;

        const firstPrice = priceResult.period.at(-1)?.close || 0;
        let lastKnownPrice = firstPrice;

        for (const [, allPrice] of allPrices.entries()) {
            const price = priceResult.period.find(p => Math.abs(allPrice.date.getTime() - p.time * 1000) < timeframe.threshold);
            if (price) {
                lastKnownPrice = price.close;
            }
            allPrice[symbol] = lastKnownPrice;
        }

        closeClient({ clientId: priceResult.clientId });
        return { ...symbolData.result, symbol, price: priceResult.period };
    });

    await Promise.all(pricePromises);

    const pricesArray = Array.from(allPrices.values());
    const maxPrice = Math.max(...pricesArray.map(p => Math.max(...symbols.map(s => p[s] as number))));
    const minPrice = Math.min(...pricesArray.map(p => Math.min(...symbols.map(s => p[s] as number))));

	return {
		error: false,
		success: true,
		message: "Data fetched successfully",
		prices: pricesArray,
		timeframe: timeframeMap[timeframeParams] ? timeframeParams : "1D",
        range: {
            max: maxPrice || 0,
            min: minPrice || 0,
        }
		// prettyCurrency: prettyCurrency
		// timeframe: timeframe,
		// range: range
	}
}
