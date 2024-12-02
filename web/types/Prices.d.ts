import type { Period } from "../utils/getPrices"

interface BestGainer {
	[key: string]: string | number | string[] | Period[]
	name: string
	description: string
	logoid: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
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
	// biome-ignore lint/style/useNamingConvention: <explanation>
	relative_volume_10d_calc: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	market_cap_basic: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	fundamental_currency_code: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	price_earnings_ttm: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	earnings_per_share_diluted_ttm: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	earnings_per_share_diluted_yoy_growth_ttm: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	dividends_yield_current: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	sector_tr: string
	market: string
	sector: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	recommendation_mark: number | null
	exchange: string
	symbol: string
	prices: Period[]
	// biome-ignore lint/style/useNamingConvention: <explanation>
	enterprise_value_current: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	country_tr: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	country_code_fund: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	float_shares_percent_current: number
}

export type { BestGainer }
