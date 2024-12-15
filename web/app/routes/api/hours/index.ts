import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"
import { addDays, addHours, format, getDay, setHours, setMilliseconds, setMinutes, setSeconds } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { parse } from "node-html-parser"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"

type MarketLunchBreak = {
	start: number // Heure locale du début de la pause (en heures décimales)
	end: number // Heure locale de la fin de la pause (en heures décimales)
}

type MarketHours = {
	id: string // Identifiant unique du marché
	name: string // Nom complet du marché
	open: number // Heure d'ouverture (en heures décimales UTC)
	close: number // Heure de fermeture (en heures décimales UTC)
	lunch?: MarketLunchBreak // Pause déjeuner optionnelle
	timezone: string // Fuseau horaire (compatible avec date-fns-tz)
	days: number[] // Jours d'ouverture (lundi = 1, dimanche = 0)
	hasLogo: boolean
}

type MarketsHours = Record<string, MarketHours> // Collection de tous les marchés
type MarketHolidays = Record<string, string[]> // Collection où chaque marché a une liste de dates fériées (au format YYYY-MM-DD)

type MarketStatus = {
	marketId: string
	marketName: string
	open: boolean // Indique si le marché est actuellement ouvert
	closeReason: "holiday" | "weekend" | "lunch" | "close"
	openHour: number
	closeHour: number
	nextOpenDate: Date
	nextCloseDate: Date
	hasLogo: boolean
	timezone: string
}

type MarketsStatus = Record<string, MarketStatus>

export const loader: LoaderFunction = () => {
	const now = new Date()

	const marketsHours: MarketsHours = {
		euronext: {
			id: "euronext",
			name: "Euronext (Paris)",
			open: 9, // 09h00 heure de Paris
			close: 17.5, // 17h30 heure de Paris
			timezone: "Europe/Paris",
			days: [1, 2, 3, 4, 5],
			hasLogo: true
		},
		frankfurt: {
			id: "frankfurt",
			name: "Frankfurt Stock Exchange",
			open: 8, // 08h00 heure de Francfort
			close: 16, // 16h00 heure de Francfort
			timezone: "Europe/Berlin",
			days: [1, 2, 3, 4, 5],
			hasLogo: false
		},
		london: {
			id: "london",
			name: "London Stock Exchange",
			open: 8.5, // 08h30 heure de Londres
			close: 16.5, // 16h30 heure de Londres
			timezone: "Europe/London",
			days: [1, 2, 3, 4, 5],
			hasLogo: true
		},
		nyse: {
			id: "nyse",
			name: "New York Stock Exchange",
			open: 9.5, // 09h30 heure de New York
			close: 16, // 16h00 heure de New York
			timezone: "America/New_York",
			days: [1, 2, 3, 4, 5],
			hasLogo: true
		},
		nasdaq: {
			id: "nasdaq",
			name: "Nasdaq",
			open: 9.5, // 14h30
			close: 16, // 21h
			timezone: "America/New_York",
			days: [1, 2, 3, 4, 5],
			hasLogo: true
		},
		tokyo: {
			id: "tokyo",
			name: "Tokyo Stock Exchange",
			open: 9, // 09h00 JST (00h00 UTC)
			close: 15, // 15h00 JST (06h00 UTC)
			lunch: { start: 11.5, end: 12.5 }, // Pause déjeuner 11h30 - 12h30 heure de Tokyo
			timezone: "Asia/Tokyo",
			days: [1, 2, 3, 4, 5],
			hasLogo: false
		},
		hongkong: {
			id: "hongkong",
			name: "Hong Kong Stock Exchange",
			open: 9.5, // 09h30 heure locale
			close: 16, // 16h00 heure locale
			lunch: { start: 12, end: 13 }, // 12h00 - 13h00 heure locale
			timezone: "Asia/Hong_Kong",
			days: [1, 2, 3, 4, 5], // Du lundi au vendredi
			hasLogo: false
		},
		sydney: {
			id: "sydney",
			name: "Australian Securities Exchange",
			open: 10, // 10h00 heure locale
			close: 16, // 16h00 heure locale
			timezone: "Australia/Sydney",
			days: [1, 2, 3, 4, 5], // Du lundi au vendredi
			hasLogo: false
		}
	}

	const marketHolidays: MarketHolidays = {
		euronext: ["2024-01-01", "2024-04-01", "2024-12-25"],
		london: ["2024-01-01", "2024-12-25", "2024-12-26"],
		nyse: ["2024-01-01", "2024-07-04", "2024-12-25"],
		nasdaq: ["2024-01-01", "2024-07-04", "2024-12-25"],
		tokyo: ["2024-01-01", "2024-01-02", "2024-01-03", "2024-12-31"],
		hongkong: ["2024-01-01", "2024-02-10", "2024-04-05"],
		sydney: ["2024-01-01", "2024-01-26", "2024-12-25"]
	}

	const status = getMarketsStatus(marketsHours, marketHolidays, now)
	const statusValues = Object.values(status)

	console.log(statusValues)

	return statusValues
}

function getMarketsStatus(
	marketsHours: MarketsHours,
	marketHolidays: MarketHolidays,
	date = new Date()
): MarketsStatus {
	const status: MarketsStatus = {}

	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const marketId in marketsHours) {
		const market = marketsHours[marketId]
		// Convertir la date UTC à la date locale du marché
		const zonedDate = toZonedTime(date, market.timezone)

		const localDate = new Date(zonedDate.toLocaleString("en-US", { timeZone: market.timezone }))

		const day = getDay(localDate) // Jour local de la semaine (0 = dimanche, 6 = samedi)
		const hour = localDate.getHours() + localDate.getMinutes() / 60 // Heure locale

		// Vérification des jours d'ouverture
		if (!market.days.includes(day)) {
			console.log(`Market for ${market.name} is closed today`)

			// Week-end ou jour non ouvré
			status[marketId] = {
				marketId,
				marketName: market.name,
				open: false,
				closeReason: "weekend",
				nextOpenDate: findNextOpening(market, zonedDate),
				nextCloseDate: zonedDate,
				hasLogo: market.hasLogo,
				openHour: market.open,
				closeHour: market.close,
				timezone: market.timezone
			}

			continue
		}

		// Vérification des jours fériés
		if (isHoliday(marketsHours, marketHolidays, marketId, zonedDate)) {
			console.log(`Market for ${market.name} is closed today (holiday)`)

			status[marketId] = {
				marketId,
				marketName: market.name,
				open: false,
				closeReason: "holiday",
				nextOpenDate: findNextOpening(market, zonedDate),
				nextCloseDate: zonedDate,
				hasLogo: market.hasLogo,
				openHour: market.open,
				closeHour: market.close,
				timezone: market.timezone
			}
			continue
		}

		// Gestion des heures d'ouverture/fermeture
		let isOpen = hour >= market.open && hour < market.close
		let closeReason: "holiday" | "weekend" | "lunch" | "close" = "close"
		let nextOpenDate: Date = new Date()
		let nextCloseDate: Date = new Date()

		if (market.lunch) {
			const { start, end } = market.lunch
			if (hour >= start && hour < end) {
				console.log(`Market for ${market.name} is closed today (lunch break)`)

				isOpen = false
				closeReason = "lunch"
				// Calculer l'heure de réouverture après la pause déjeuner
				nextOpenDate = toZonedTime(addHours(zonedDate, end - hour), market.timezone)
				status[marketId] = {
					marketId,
					marketName: market.name,
					open: false,
					closeReason,
					nextOpenDate,
					nextCloseDate: zonedDate,
					hasLogo: market.hasLogo,
					openHour: market.open,
					closeHour: market.close,
					timezone: market.timezone
				}
				continue
			}
		}

		if (isOpen) {
			// Si le marché est ouvert, calculer la prochaine fermeture locale
			nextCloseDate = findNextClosing(market, zonedDate)
		} else {
			console.log(`Market for ${market.name} is closed today (outside of trading hours)`)

			// Si le marché est fermé, calculer la prochaine ouverture locale
			nextOpenDate =
				hour < market.open
					? toZonedTime(addHours(zonedDate, market.open - hour), market.timezone)
					: findNextOpening(market, zonedDate)
		}

		// Ajouter le statut au résultat
		status[marketId] = {
			marketId,
			marketName: market.name,
			open: isOpen,
			closeReason,
			nextOpenDate: isOpen ? nextCloseDate : nextOpenDate,
			nextCloseDate: isOpen ? nextCloseDate : zonedDate,
			hasLogo: market.hasLogo,
			openHour: market.open,
			closeHour: market.close,
			timezone: market.timezone
		}
	}

	return status
}

function findNextClosing(market: MarketHours, zonedDate: Date): Date {
	const hour = zonedDate.getHours() + zonedDate.getMinutes() / 60

	// Si l'heure actuelle est avant l'heure de fermeture, la prochaine fermeture est aujourd'hui
	if (hour < market.close) {
		return toZonedTime(addHours(zonedDate, market.close - hour), market.timezone)
	}

	// Si l'heure actuelle est après l'heure de fermeture, la prochaine fermeture est le jour suivant
	return toZonedTime(addDays(zonedDate, 1), market.timezone)
}

function findNextOpening(market: MarketHours, date: Date): Date {
	let nextDate = toZonedTime(date, market.timezone)
	let nextDay = getDay(nextDate)

	// Avancer jusqu'à trouver le prochain jour ouvré dans le fuseau local, en évitant les jours fériés et les heures de fermeture
	while (!market.days.includes(nextDay)) {
		nextDate = addDays(nextDate, 1) // Passer au jour suivant
		nextDay = getDay(nextDate)
	}

	// Configurer l'heure locale d'ouverture
	const nextOpenDate = toZonedTime(nextDate, market.timezone)
	const hours = Math.floor(market.open) // Heure entière
	const minutes = Math.round((market.open % 1) * 60) // Minutes
    const openDateWithTime = setMilliseconds(setSeconds(setMinutes(setHours(nextOpenDate, hours), minutes), 0), 0) // Régler l'heure locale d'ouverture

	console.log(`Next opening for ${market.name} is at ${format(openDateWithTime, "yyyy-MM-dd HH:mm:ss")}`)

	return new Date(openDateWithTime.toISOString())
}

function isHoliday(marketsHours: MarketsHours, marketHolidays: MarketHolidays, marketId: string, date: Date) {
	const holidays = marketHolidays[marketId] || []
	const localDate = toZonedTime(date, marketsHours[marketId].timezone)
	const formattedDate = format(localDate, "yyyy-MM-dd")
	return holidays.includes(formattedDate)
}
