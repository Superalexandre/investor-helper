import { and, createFilterExpression, or, type ColumnType } from "../../../../utils/tradingview/filter"

export const columns: ColumnType[] = [
	"exchange",
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
	"exchange",
	"enterprise_value_current",
	"country.tr",
	"country_code_fund",
	"float_shares_percent_current",
	"recommendation_mark"
]

/*
export const filter = {
	operator: "and",
	operands: [
		{
			operation: {
				operator: "and",
				operands: [
					// {
					// 	expression: {
					// 		left: "enterprise_value_current",
					// 		operation: "greater",
					// 		right: 0
					// 	}
					// },
					{
						expression: {
							left: "country_code_fund",
							operation: "equal",
							right: "FR"
						}
					},
					{
						expression: {
							left: "market_cap_basic",
							operation: "greater",
							right: 0
						}
					},
					{
						expression: {
							left: "volume",
							operation: "greater",
							right: 0
						}
					}, 
					// {
					// 	expression: {
					// 		left: "float_shares_percent_current",
					// 		operation: "greater",
					// 		right: 0
					// 	}
					// }
				]
			}
		},
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
	*/

// Convert filter object to FilterOperation schema
export const filter = and(
	and(
		createFilterExpression("country_code_fund", "equal", "FR"),
		createFilterExpression("market_cap_basic", "greater", 0),
		createFilterExpression("volume", "greater", 0)
	),
	or(
		and(createFilterExpression("type", "equal", "stock"), createFilterExpression("typespecs", "has", ["common"])),
		and(
			createFilterExpression("type", "equal", "stock"),
			createFilterExpression("typespecs", "has", ["preferred"])
		),
		createFilterExpression("type", "equal", "dr"),
		and(
			createFilterExpression("type", "equal", "fund"),
			createFilterExpression("typespecs", "has_none_of", ["etf"])
		)
	)
)
