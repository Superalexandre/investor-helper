import type { BestGainer } from "../../../../../types/Prices"
import getPrices, { closeClient } from "../../../../../utils/getPrices"

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

	const parsedResult: BestGainer[] = []

	for (const item of result.data) {
		const reducedItem = columns.reduce((acc, key, index) => {
			acc[key] = item.d[index]
			return acc
		}, {} as BestGainer)

		reducedItem.symbol = item.s

		parsedResult.push(reducedItem)
	}

	console.log("items : ", parsedResult.length)

	await Promise.all(
		parsedResult.map(async (item) => {
			const prices = await getPrices(item.symbol, {
				timeframe: "1",
				range: 360,
			})

			const reversedPrices = prices.period.reverse()

			item.prices = reversedPrices
		})
	)

	closeClient()

	return {
		result: parsedResult
	}
}
