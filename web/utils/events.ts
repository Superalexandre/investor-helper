import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import config from "../../config.js"
import { startOfWeek, formatISO, addDays } from "date-fns"
import { type Events, events as eventsSchema } from "../../db/schema/events.js"
import { and, asc, desc, eq, gte, isNotNull, lte } from "drizzle-orm"

// interface EconomicEvent {
//     id: number,
//     start: Date,
//     end: Date,
//     originalTitle: string,
//     summary: string,
//     description: string,
//     location: string,
//     url: string,
//     importance: number,
//     numberOfEvents: number
// }

/*
calendarHono.get("/", async (req) => {
    const events = await getEvents()
    if (!events || events.error) return req.json(events)

    const filename = "calendar.ics"
    const calendar = ical({
        name: "Economic Calendar"
    })

    // Convert the importance of the event (-1, 0, 1) to a string
    type Importance = -1 | 0 | 1;
    const importanceMap: Record<Importance, string> = {
        [-1]: "low",
        0: "medium",
        1: "high"
    }

    const stars: Record<string, string> = {
        "low": "⁎",
        "medium": "⁑",
        "high": "⁂"
    }

    const frenchImportance: Record<string, string> = {
        "low": "Faible",
        "medium": "Moyen",
        "high": "Élevé"
    }


    const filters = config.calendarPreferences.filters

    const eventsList: EconomicEvent[] = []

    for (const event of events) {
        const { id, title, country, indicator, comment, period, referenceDate, source, source_url: sourceUrl, actual, previous, forecast, currency, importance, date, unit, scale } = event

        const importanceString = importanceMap[importance as Importance] || "medium"

        // Check if the importance of the event is in the preferences
        const filter = filters.find(filterFind => filterFind.country.includes(country) && filterFind.importance.includes(importanceString))
        if (!filter) continue

        const eventTitle = `${stars[importanceString] || ""} ${country} ${title}`

        let description = `${eventTitle}\nImportance: ${frenchImportance[importanceString]}\n\n`

        if (country) description += `Pays: ${countriesFr[country] || country}\n`
        if (currency) description += `Monnaie: ${currency}\n\n`
        if (actual) description += `Actuel: ${actual}${unit ?? ""}${scale ?? ""}\n`
        if (previous) description += `Avant: ${previous}${unit ?? ""}${scale ?? ""}\n`
        if (forecast) description += `Prévisions: ${forecast}${unit ?? ""}${scale ?? ""}\n`
        if (indicator) description += `Indicateur: ${indicator}\n`
        if (comment) description += `\nCommentaire: ${comment}\n`
        if (period) description += `\nPériode: ${period}\n`
        if (referenceDate) description += `Date de reference: ${referenceDate}\n`
        if (source) description += `\nSource: ${source}\n`
        if (sourceUrl) description += `Source URL: ${sourceUrl}\n`

        const startDate = new Date(date)
        const endDate = new Date(date)
        endDate.setHours(endDate.getHours() + 1)

        const eventExists = eventsList.find(eventFind => {
            const similarity = stringComparison.levenshtein.similarity(eventFind.originalTitle, eventTitle)
            
            return similarity > 0.6 && new Date(eventFind.start).getTime() === startDate.getTime() && eventFind.location === country
        })
        if (eventExists) {
            eventExists.numberOfEvents++

            // Keep the most important event in the summary
            let strongestImportance = importance
            if (importance < eventExists.importance) strongestImportance = eventExists.importance 
            
            const strongestImportanceString = importanceMap[strongestImportance as Importance] || "medium"


            eventExists.summary = `${stars[strongestImportanceString] || ""} ${country} ${eventExists.numberOfEvents} événements`
            eventExists.description += `\n------------------------------------\n${description}`

            continue
        }

        eventsList.push({
            id,
            start: startDate,
            end: endDate,
            originalTitle: eventTitle,
            summary: eventTitle,
            description,
            location: country,
            url: sourceUrl,
            importance,
            numberOfEvents: 1
        })

        // calendar.createEvent({
        //     id,
        //     start: startDate,
        //     end: endDate,
        //     summary: eventTitle,
        //     description,
        //     location: country,
        //     url: sourceUrl
        // })
    }

    for (const event of eventsList) {
        calendar.createEvent(event)
    }

    req.header("Content-Type", "text/calendar")
    req.header("Content-Disposition", `attachment; filename=${filename}`)

    return req.text(calendar.toString())
})
*/

async function getEvents({
	page = 1,
	limit = 10,
	desc: descOrder = "desc"
}: { page?: number; limit?: number; desc?: "asc" | "desc" }) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const referenceDate = new Date()

	referenceDate.setMinutes(referenceDate.getMinutes() - 20)

	const allEvents = await db
		.select()
		.from(eventsSchema)
		.limit(limit)
		.offset(limit * (page - 1))
		.where(and(isNotNull(eventsSchema.date), gte(eventsSchema.date, referenceDate.toISOString())))
		.orderBy(descOrder === "asc" ? asc(eventsSchema.date) : desc(eventsSchema.date))
	// .orderBy(desc(eventsSchema.referenceDate))

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

interface EventRaw {
	[key: string]: string | number | null
	id: string
	title: string
	country: string
	indicator: string
	category: string | null
	period: string
	referenceDate: null | string
	source: string
	// biome-ignore lint/style/useNamingConvention: API response
	source_url: string
	actual: null | number
	previous: null | number
	forecast: null | number
	actualRaw: null | number
	previousRaw: null | number
	forecastRaw: null | number
	currency: string
	importance: number
	date: string
	ticker: string | null
	comment: string | null
	unit: string | null
	scale: string | null
}

async function fetchEvents() {
	const url = new URL(config.url.events)

	const now = new Date()

	const from = formatISO(startOfWeek(now, { weekStartsOn: 0 }))

	const dayToAdd = config.calendarPreferences.numberOfDays
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
					// biome-ignore lint/nursery/noSecrets: <explanation>
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
			return console.error("Error fetching agenda (trading view error)", response.status)
		}

		const json = await response.json()
		const events = json.result

		if (!events || events.length === 0) {
			return console.error("No events found")
		}

		return events as EventRaw[]
	} catch (error) {
		return console.error("Error fetching agenda (can't fetch)", error)
	}
}

async function saveFetchEvents() {
	const events = await fetchEvents()

	if (!events || events.length === 0) {
		return console.error("No events found")
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

	console.log(`Inserted ${eventsValues.length} events`)
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

export { getEvents, getEventById, fetchEvents, saveFetchEvents, saveEvents, getEventsNow, getNextImportantEvent }
