import { reverseNormalizeSymbol } from "./normalizeSymbol.js"

interface RawSymbol {
	"High.1M": number
	"Low.1M": number
	"Perf.1M": number
	"Perf.3M": number
	"Perf.6M": number
	"Perf.W": number
	"Perf.Y": number
	"Perf.YTD": number
	"Recommend.All": number
	// biome-ignore lint/style/useNamingConvention: API field names
	average_volume_10d_calc: number
	// biome-ignore lint/style/useNamingConvention: API field names
	average_volume_30d_calc: number
	country: string
	// biome-ignore lint/style/useNamingConvention: API field names
	country_code_fund: string
	market: string
	// biome-ignore lint/style/useNamingConvention: API field names
	nav_discount_premium: number
	// biome-ignore lint/style/useNamingConvention: API field names
	open_interest: number
	// biome-ignore lint/style/useNamingConvention: API field names
	price_52_week_high: number
	// biome-ignore lint/style/useNamingConvention: API field names
	price_52_week_low: number
	sector: string
	logoid: string
	name: string
	description: string
	// biome-ignore lint/style/useNamingConvention: API field names
	base_currency_logoid: string
	currency: string
	exchange: string
}

export default async function getSymbolData(symbolId: string) {
	const fields = [
		"High.1M",
		"Low.1M",
		"Perf.1M",
		"Perf.3M",
		"Perf.6M",
		"Perf.W",
		"Perf.Y",
		"Perf.YTD",
		"Recommend.All",
		"average_volume_10d_calc",
		"average_volume_30d_calc",
		"country",
		"country_code_fund",
		"market",
		"nav_discount_premium",
		"open_interest",
		"price_52_week_high",
		"price_52_week_low",
		"sector",
		"logoid",
		"name",
		"description",
		"base_currency_logoid",
		"currency",
		"exchange",
		"isin",
	]

	const url = `https://scanner.tradingview.com/symbol?symbol=${reverseNormalizeSymbol(symbolId)}&fields=${fields.join("%2C")}&no_404=true&label-product=right-details`

	const res = await fetch(url, {
		headers: {
			"User-Agent":
				// biome-ignore lint/nursery/noSecrets: No secrets
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
		}
	})

	const data = await res.json()

	return data as RawSymbol
}

export type { RawSymbol }
