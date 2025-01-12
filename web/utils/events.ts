import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import config from "../../config.js"
import { startOfWeek, formatISO, addDays, startOfMonth, endOfMonth } from "date-fns"
import { type Events, eventsSchema } from "../../db/schema/events.js"
import { and, asc, desc, eq, gte, isNotNull, like, lte, or } from "drizzle-orm"
import type { EventRaw } from "../types/Events.js"
import logger from "../../log/index.js"

async function getEvents({
	page = 1,
	limit = 10,
	order = "desc",
	month,
	year
}: { page?: number; limit?: number; order?: "asc" | "desc"; month?: number; year?: number } = {}) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const referenceDate = new Date()
	referenceDate.setMinutes(referenceDate.getMinutes() - 20)

	const today = new Date()

	// Set the from and to dates with the month and year parameters
	const safeYear = year || today.getFullYear()
	const safeMonth = month || today.getMonth()

	const from = startOfMonth(new Date(safeYear, safeMonth))
	const to = endOfMonth(new Date(safeYear, safeMonth))

	console.log(from, to, month, year)

	const allEvents = await db
		.select()
		.from(eventsSchema)
		.limit(!month && !year ? limit : -1)
		.offset(!month && !year ? limit * (page - 1) : 0)
		.where(
			and(
				isNotNull(eventsSchema.date),
				and(
					month || year ? and(
						gte(eventsSchema.date, from.toISOString()),
						lte(eventsSchema.date, to.toISOString())
					) : undefined,
					// year ? and(
					// 	gte(eventsSchema.date, from.toISOString()),
					// 	lte(eventsSchema.date, to.toISOString())
					// ) : undefined,
					!month && !year ? gte(eventsSchema.date, referenceDate.toISOString()) : undefined
				)
			)
		)
		.orderBy(order === "asc" ? asc(eventsSchema.date) : desc(eventsSchema.date))

	return allEvents
}

async function getEventById({ id }: { id: string }) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const event = await db.select().from(eventsSchema).where(eq(eventsSchema.id, id))

	return {
		event: event[0]
	}
}

async function fetchEvents() {
	logger.info("Fetching events")

	const url = new URL(config.url.events)

	const now = new Date()

	const from = formatISO(startOfWeek(now, { weekStartsOn: 0 }))

	// const dayToAdd = config.calendarPreferences.numberOfDays
	const dayToAdd = 31 * 3
	const to = formatISO(addDays(new Date(from), dayToAdd))

	const countries = [
		"AR",
		"AU",
		"BR",
		"CA",
		"CN",
		"FR",
		"DE",
		"IN",
		"ID",
		"IT",
		"JP",
		"KR",
		"MX",
		"RU",
		"SA",
		"ZA",
		"TR",
		"GB",
		"US",
		"EU"
	]

	url.searchParams.append("from", from)
	url.searchParams.append("to", to)
	url.searchParams.append("countries", countries.join(","))

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
				// biome-ignore lint/style/useNamingConvention: Default headers
				Accept: "application/json, text/javascript, */*; q=0.01",
				"Accept-Language": "en-US,en;q=0.9",
				// biome-ignore lint/style/useNamingConvention: Default headers
				Connection: "keep-alive",

				// biome-ignore lint/style/useNamingConvention: Default headers
				Referer: config.url.eventsOrigin,
				// biome-ignore lint/style/useNamingConvention: Default headers
				Origin: config.url.eventsOrigin
			}
		})

		// if (!response.ok) return { success: false, error: true, message: "Error fetching agenda (trading view error)", status: response.status }
		if (!response.ok) {
			logger.error(`Error fetching agenda (trading view error) ${response.status}`)

			return []
		}

		const json = await response.json()
		const events = json.result

		if (!events || events.length === 0) {
			logger.error("No events found")

			return []
		}

		return events as EventRaw[]
	} catch (error) {
		logger.error("Error fetching agenda (can't fetch)", error)

		return []
	}
}

async function saveFetchEvents() {
	const events = await fetchEvents()

	if (!events || events.length === 0) {
		logger.error("No events found")
		return []
	}

	await saveEvents(events)
}

async function saveEvents(events: EventRaw[]) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const eventsValues: Events[] = []
	// let updatedEvents = 0

	for (const event of events) {
		const eventDb = await db.select().from(eventsSchema).where(eq(eventsSchema.id, event.id))

		// Update the event if it already exists
		if (eventDb.length > 0) {
			continue
		}

		const frenchComment: string | null = null

		eventsValues.push({
			...event,
			frenchComment: frenchComment,
			sourceUrl: event.source_url
		})
	}

	if (eventsValues.length > 0) {
		await db.insert(eventsSchema).values(eventsValues)
	}

	logger.success(`Inserted ${eventsValues.length} events`)
}

// Make a function to get the events that are happening rn
async function getEventsNow() {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const referenceDateFrom = new Date()

	// Set seconds and milliseconds to 0
	referenceDateFrom.setSeconds(0)
	referenceDateFrom.setMilliseconds(0)

	const referenceDateTo = new Date(referenceDateFrom)

	// Set seconds to 59 and milliseconds to 999
	referenceDateTo.setSeconds(59)
	referenceDateTo.setMilliseconds(999)

	const allEvents = await db
		.select()
		.from(eventsSchema)
		.where(
			and(
				isNotNull(eventsSchema.date),
				and(
					gte(eventsSchema.date, referenceDateFrom.toISOString()),
					lte(eventsSchema.date, referenceDateTo.toISOString())
				)
			)
		)
		.orderBy(asc(eventsSchema.date))

	return allEvents
}

async function getNextImportantEvent(from: Date, to: Date, importance: number, limit: number) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const events = await db
		.select()
		.from(eventsSchema)
		.where(
			and(
				gte(eventsSchema.importance, importance),
				and(
					isNotNull(eventsSchema.date),
					and(gte(eventsSchema.date, from.toISOString()), lte(eventsSchema.date, to.toISOString()))
				)
			)
		)
		.limit(limit)

	return events
}

async function searchEvents(search: string, limit = 10) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const events = await db
		.select()
		.from(eventsSchema)
		.where(
			or(
				like(eventsSchema.title, `%${search}%`),
				like(eventsSchema.country, `%${search}%`),
				like(eventsSchema.indicator, `%${search}%`),
				like(eventsSchema.comment, `%${search}%`),
				like(eventsSchema.period, `%${search}%`),
				like(eventsSchema.referenceDate, `%${search}%`),
				like(eventsSchema.source, `%${search}%`),
				like(eventsSchema.sourceUrl, `%${search}%`)
			)
		)
		.limit(limit)

	return events
}

export {
	getEvents,
	getEventById,
	fetchEvents,
	saveFetchEvents,
	saveEvents,
	getEventsNow,
	getNextImportantEvent,
	searchEvents
}
