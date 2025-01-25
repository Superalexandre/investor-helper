import type { LoaderFunction } from "@remix-run/node"
import getWalletById from "../../../../../../utils/getWallet"
import { getUser } from "../../../../../session.server"
import getPrices, { closeClient, Period } from "../../../../../../utils/getPrices"
import { fetchSymbol } from "../../../../../../utils/tradingview/request"
import { subDays, subMonths, subYears } from "date-fns"

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	const walletId = url.searchParams.get("walletId")

	if (!walletId) {
		return {
			success: false,
			error: true,
			message: "Missing walletId parameter"
		}
	}

	const user = await getUser(request)

	if (!user) {
		return {
			success: false,
			error: true,
			message: "Must be logged"
		}
	}

	const resultWallet = await getWalletById({ id: walletId, token: user.token })

	if (!resultWallet) {
		return {
			success: false,
			error: true,
			message: "No wallet found"
		}
	}

	const currentDate = new Date()
	currentDate.setMinutes(0)
	currentDate.setSeconds(0)
	currentDate.setMilliseconds(0)

	const timeframeMap: Record<
		string,
		{
			timeframe: [string, number]
			from: Date
			interval: number // In MS
		}
	> = {
		"1W": {
			timeframe: ["60", 168],
			from: subDays(currentDate, 7),
			// 1 heure
			interval: 3600000
		},
		"1M": {
			timeframe: ["60", 1860],
			from: subMonths(currentDate, 1),
			// 1 heure
			interval: 3600000
		}
	}

	const timeframe = timeframeMap["1W"]
	const [timeframePrice, range] = timeframe.timeframe

	const allPrices: Record<
		string,
		{
			date: Date
			value: number
			netValue: number
			details: Array<{
				symbol: string
				price: number
				purchasePrice: number
				performance: number
			}>
		}
	> = {}

	const interval = timeframe.interval / 2
	for (let date = timeframe.from; date < currentDate; date = new Date(date.getTime() + interval)) {
		allPrices[date.toISOString()] = {
			date,
			value: 0,
			netValue: 0,
			details: []
		}
	}

	const prices = await Promise.all(
		resultWallet.walletSymbols.map(async (symbol) => {
			if (symbol.quantity <= 0) {
				return
			}

			const [priceResult, symbolData] = await Promise.all([
				getPrices(symbol.symbol, {
					timeframe: timeframePrice,
					range: range
				}),
				fetchSymbol({
					language: "fr-FR",
					symbol: symbol.symbol,
					fields: "all"
				})
			])

			if (!priceResult) {
				return
			}

			const purchasePrice = Number(symbol.buyPrice || 0)

			const lastPrice = priceResult.period[0].close
			const firstPrice = priceResult.period.at(-1)?.close || 0

			console.log("lastPrice", new Date(priceResult.period[0].time * 1000).toISOString())

			const totalValue = lastPrice * symbol.quantity || 0
			const performance = lastPrice * symbol.quantity - purchasePrice * symbol.quantity
			// const performancePercentage = (lastPrice - purchasePrice) / purchasePrice

			let lastKnownPrice = firstPrice
			const allPricesKeys = Object.keys(allPrices)
			for (const date of allPricesKeys) {
				const allPrice = allPrices[date]

				const price = priceResult.period.find((price) => {
					return new Date(price.time * 1000).toISOString() === date
				})

				if (!price) {
					allPrices[date].netValue += purchasePrice * symbol.quantity - lastKnownPrice * symbol.quantity
					allPrices[date].value += lastKnownPrice * symbol.quantity

					continue
				}

				const diff = Math.abs(allPrice.date.getTime() - price.time * 1000)
				const threshold = 1000 * 60 * 60 * 0.5 // 30 minutes

				if (diff < threshold) {
					lastKnownPrice = price.close
				}

				allPrices[date].netValue += purchasePrice * symbol.quantity - lastKnownPrice * symbol.quantity
				allPrices[date].value += lastKnownPrice * symbol.quantity
				allPrices[date].details.push({
					symbol: symbol.symbol,
					price: price.close,
					purchasePrice,
					performance: (price.close - purchasePrice) / purchasePrice
				})
			}

			return {
				...symbolData.result,
				symbol: symbol.symbol,
				quantity: symbol.quantity,
				buyPrice: purchasePrice,
				price: priceResult.period,
				purchasePrice,
				performance,
				totalValue
			}
		})
	)

	closeClient()

	const validPrices = prices.filter((price) => price !== undefined)

	// @ts-expect-error Description is defined
	const portfolioWeights = calculatePortfolioWeights(validPrices)
	// @ts-expect-error Sector is defined
	const sectorWeights = calculateSectorWeights(validPrices)

	return {
		success: true,
		error: false,
		message: "Data fetched successfully",
		data: {
			...resultWallet,
			prices: prices.filter((price) => price !== undefined),
			portfolioWeights: portfolioWeights.sort((a, b) => b.weight - a.weight),
			sectorWeights: sectorWeights.sort((a, b) => b.weight - a.weight),
			allPrices: Object.values(allPrices)
		}
	}
}

function calculatePortfolioWeights(
	prices: Array<{ symbol: string; totalValue: number; description: string }>
): Array<{ symbol: string; weight: number; description: string }> {
	// Calculer la valeur totale du portefeuille
	const totalPortfolioValue = prices.reduce((sum, item) => sum + (item.totalValue || 0), 0)

	// Si le portefeuille est vide ou total égal à zéro
	if (totalPortfolioValue === 0) {
		return prices.map((item) => ({
			symbol: item.symbol,
			description: item.description,
			weight: 0
		}))
	}

	// Calculer le poids de chaque action
	return prices.map((item) => ({
		symbol: item.symbol,
		description: item.description,
		weight: ((item.totalValue || 0) / totalPortfolioValue) * 100
	}))
}
function calculateSectorWeights(
	prices: Array<{ symbol: string; totalValue: number; sector: string; "sector.tr": string }>
): Array<{ sector: string; weight: number; "sector.tr": string }> {
	// Calculer la valeur totale du portefeuille
	const totalPortfolioValue = prices.reduce((sum, item) => sum + (item.totalValue || 0), 0)

	// Si le portefeuille est vide ou total égal à zéro
	if (totalPortfolioValue === 0) {
		return []
	}

	// Grouper les valeurs par secteur
	const sectorTotals = prices.reduce(
		(acc, item) => {
			const sector = item.sector || "Unknown" // Secteur inconnu
			const sectorTr = item["sector.tr"] || "Unknown" // Traduction du secteur

			// Si le secteur n'existe pas encore dans l'accumulateur
			if (!acc[sector]) {
				acc[sector] = {
					totalValue: 0,
					"sector.tr": sectorTr
				}
			}

			// Ajouter la valeur totale à ce secteur
			acc[sector].totalValue += item.totalValue || 0

			return acc
		},
		{} as Record<string, { totalValue: number; "sector.tr": string }>
	)

	// Calculer les poids en pourcentage pour chaque secteur
	return Object.entries(sectorTotals).map(([sector, { totalValue, "sector.tr": sectorTr }]) => ({
		sector,
		"sector.tr": sectorTr, // Inclure la traduction du secteur
		weight: (totalValue / totalPortfolioValue) * 100 // Poids en pourcentage
	}))
}
