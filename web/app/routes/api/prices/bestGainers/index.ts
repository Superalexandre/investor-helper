const columns = [
	"name",
	"description",
	"logoid",
	"update_mode",
	"type",
	"typespecs",
	"close",
	"pricescale",
	"minmov",
	"fractional",
	"minmove2",
	"currency",
	"change",
	"volume",
	"relative_volume_10d_calc",
	"market_cap_basic",
	"fundamental_currency_code",
	"price_earnings_ttm",
	"earnings_per_share_diluted_ttm",
	"earnings_per_share_diluted_yoy_growth_ttm",
	"dividends_yield_current",
	"sector.tr",
	"market",
	"sector",
	"recommendation_mark",
	"exchange"
]

const filter = {
	operator: "and",
	operands: [
		{
			operation: {
				operator: "or",
				operands: [
					{
						operation: {
							operator: "and",
							operands: [
								{
									expression: {
										left: "type",
										operation: "equal",
										right: "stock"
									}
								},
								{
									expression: {
										left: "typespecs",
										operation: "has",
										right: ["common"]
									}
								}
							]
						}
					},
					{
						operation: {
							operator: "and",
							operands: [
								{
									expression: {
										left: "type",
										operation: "equal",
										right: "stock"
									}
								},
								{
									expression: {
										left: "typespecs",
										operation: "has",
										right: ["preferred"]
									}
								}
							]
						}
					},
					{
						operation: {
							operator: "and",
							operands: [
								{
									expression: {
										left: "type",
										operation: "equal",
										right: "dr"
									}
								}
							]
						}
					},
					{
						operation: {
							operator: "and",
							operands: [
								{
									expression: {
										left: "type",
										operation: "equal",
										right: "fund"
									}
								},
								{
									expression: {
										left: "typespecs",
										operation: "has_none_of",
										right: ["etf"]
									}
								}
							]
						}
					}
				]
			}
		}
	]
}

interface Stock {
	name: string
	description: string
	logoid: string
	update_mode: string
	type: string
	typespecs: string
	close: number
	pricescale: number
	minmov: number
	fractional: boolean
	minmove2: number
	currency: string
	change: number
	volume: number
	relative_volume_10d_calc: number
	market_cap_basic: number
	fundamental_currency_code: string
	price_earnings_ttm: number
	earnings_per_share_diluted_ttm: number
	earnings_per_share_diluted_yoy_growth_ttm: number
	dividends_yield_current: number
	sector_tr: string
	market: string
	sector: string
	recommendation_mark: string
	exchange: string
}

export async function loader() {
	const country = "france"

	const url = `https://scanner.tradingview.com/${country}/scan?label-product=screener-stock`
	const request = await fetch(url, {
		method: "POST",
		body: JSON.stringify({
			columns,
			filter2: filter,
			ignore_unknown_fields: false,
			options: {
				lang: "fr"
			},
			range: [0, 100],
			sort: {
				sortBy: "change",
				sortOrder: "desc"
			},
			symbols: {},
			markets: [country]
		})
	})

	if (!request.ok) {
		return null
	}

	const result = await request.json()

	const parsedResult = result.data.map((item: any) => {
		const reducedItem = columns.reduce(
			(acc, key, index) => {
				acc[key] = item.d[index]
				return acc
			},
			{} as Record<string, string | number | string[]>
		)

        reducedItem.symbol = item.s

        return reducedItem
	})

    console.log(parsedResult[0])

	return {
		result: parsedResult
	}
}
