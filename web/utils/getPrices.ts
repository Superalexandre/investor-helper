// @ts-ignore - Ignoring import error
import TradingView from "@mathieuc/tradingview"
import { reverseNormalizeSymbol } from "./normalizeSymbol"
import type { TimeFrame } from "../types/modules"
import logger from "../../log"

interface Period {
	time: number
	open: number
	close: number
	max: number
	min: number
	volume: number
}

type Subsession = {
	description: string
	id: string
	private: boolean
	session: string
	"session-correction"?: string
	"session-display": string
}

interface PeriodInfo {
	// biome-ignore lint/style/useNamingConvention: API response
	series_id: string
	source2: {
		country: string
		description: string
		"exchange-type": string
		id: string
		name: string
		url: string
	}
	// biome-ignore lint/style/useNamingConvention: API response
	currency_code: string
	// biome-ignore lint/style/useNamingConvention: API response
	source_id: string
	// biome-ignore lint/style/useNamingConvention: API response
	session_holidays: string
	// biome-ignore lint/style/useNamingConvention: API response
	subsession_id: string
	// biome-ignore lint/style/useNamingConvention: API response
	provider_id: string
	// biome-ignore lint/style/useNamingConvention: API response
	currency_id: string
	country: string
	// biome-ignore lint/style/useNamingConvention: API response
	pro_perm: string
	measure: string
	// biome-ignore lint/style/useNamingConvention: API response
	allowed_adjustment: string
	// biome-ignore lint/style/useNamingConvention: API response
	short_description: string
	// biome-ignore lint/style/useNamingConvention: API response
	variable_tick_size: string
	isin: string
	language: string
	// biome-ignore lint/style/useNamingConvention: API response
	local_description: string
	name: string
	// biome-ignore lint/style/useNamingConvention: API response
	full_name: string
	// biome-ignore lint/style/useNamingConvention: API response
	pro_name: string
	// biome-ignore lint/style/useNamingConvention: API response
	base_name: string[]
	description: string
	exchange: string
	pricescale: number
	pointvalue: number
	minmov: number
	session: string
	// biome-ignore lint/style/useNamingConvention: API response
	session_display: string
	subsessions: Subsession[]
	type: string
	typespecs: string[]
	// biome-ignore lint/style/useNamingConvention: API response
	has_intraday: boolean
	fractional: boolean
	// biome-ignore lint/style/useNamingConvention: API response
	listed_exchange: string
	legs: string[]
	// biome-ignore lint/style/useNamingConvention: API response
	is_tradable: boolean
	minmove2: number
	timezone: string
	aliases: string[]
	alternatives: string[]
	// biome-ignore lint/style/useNamingConvention: API response
	is_replayable: boolean
	// biome-ignore lint/style/useNamingConvention: API response
	has_adjustment: boolean
	// biome-ignore lint/style/useNamingConvention: API response
	has_extended_hours: boolean
	// biome-ignore lint/style/useNamingConvention: API response
	bar_source: string
	// biome-ignore lint/style/useNamingConvention: API response
	bar_transform: string
	// biome-ignore lint/style/useNamingConvention: API response
	bar_fillgaps: boolean
	// biome-ignore lint/style/useNamingConvention: API response
	visible_plots_set: string
	"is-tickbars-available": boolean
	figi: {
		"country-composite": string
		"exchange-level": string
	}
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
let client: any

export default function getPrices(
	symbolId: string,
	{
		range = 100,
		timeframe = "D"
	}: {
		range?: number
		timeframe?: string
	} = {}
) {
	return new Promise<{ period: Period[]; periodInfo: PeriodInfo }>((resolve, reject) => {
		if (!client) {
			logger.info("Creating new client")

			client = new TradingView.Client()
		}
		// if (!chart) chart = new client.Session.Chart()
		const chart = new client.Session.Chart()

		chart.setMarket(reverseNormalizeSymbol(symbolId), {
			timeframe: timeframe as TimeFrame,
			range
			// type: "HeikinAshi" as ChartType
		})

		chart.onError((...err: unknown[]) => {
			logger.error("Chart error:", ...err)
			reject(err)
		})

		// chart.onSymbolLoaded(() => {})

		chart.onUpdate(() => {
			// When price changes
			if (!chart.periods[0]) {
				return
			}

			resolve({
				period: chart.periods,
				periodInfo: chart.infos
			})
		})
	})
}

export function closeClient() {
	if (client) {
		logger.info("Closing client")

		client.end()

		client = null
	}
}

export function formatPrices(prices: Period[]): Period[] {
	if (prices.length <= 1) {
		return prices
	}

	const interval = prices[1].time - prices[0].time

	const DAY_IN_MS = 24 * 60 * 60 * 1000
	const HOUR_IN_MS = 60 * 60 * 1000

    let filteredPrices: Period[];

    if (interval >= DAY_IN_MS) {
        filteredPrices = prices;
    } else if (interval < DAY_IN_MS && interval >= HOUR_IN_MS) {
        filteredPrices = prices.filter((_, index) => index % 2 === 0);
    } else {
        filteredPrices = prices.filter((_, index) => index % 5 === 0);
    }

    // Ajouter le dernier prix (le plus ancien) s'il n'est pas déjà dans la liste
    if (filteredPrices.at(-1) !== prices.at(-1)) {
		const lastPrice = prices.at(-1);
		if (lastPrice) {
			filteredPrices.push(lastPrice);
		}
    }

	return filteredPrices
}

export type { Period, PeriodInfo }
