import { Hono } from "hono"
import ical from "ical-generator"
import config from "../../config.js"
import { startOfWeek, formatISO, addDays } from "date-fns"

import { countries as countriesFr } from "../../countries/countries-fr.js"

const calendarHono = new Hono()

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

    for (const event of events) {
        const { id, title, country, indicator, comment, period, referenceDate, source, source_url: sourceUrl, actual, previous, forecast, currency, importance, date, unit, scale } = event

        const importanceString = importanceMap[importance as Importance] || "medium"

        // Check if the importance of the event is in the preferences
        const filter = filters.find(filterFind => filterFind.country.includes(country) && filterFind.importance.includes(importanceString))
        if (!filter) continue

        const eventTitle = `${stars[importanceString] || ""} ${country} ${title}`

        let description = "Importance: " + frenchImportance[importanceString] + "\n\n"

        if (country) description += `Pays: ${countriesFr[country] || country}\n`
        if (currency) description += `Monnaie: ${currency}\n\n`
        if (actual) description += `Actuel: ${actual}${unit ?? ""}${scale ?? ""}\n`
        if (previous) description += `Avant: ${previous}${unit ?? ""}${scale ?? ""}\n`
        if (forecast) description += `Prévisions: ${forecast}${unit ?? ""}${scale ?? ""}\n`
        if (indicator) description += `Indicateur: ${indicator}\n`
        if (comment) description += `\nCommentaire: ${comment}\n`
        if (period) description += `Période: ${period}\n`
        if (referenceDate) description += `Date de reference: ${referenceDate}\n`
        if (source) description += `\nSource: ${source}\n`
        if (sourceUrl) description += `Source URL: ${sourceUrl}\n`

        const startDate = new Date(date)
        const endDate = new Date(date)
        endDate.setHours(endDate.getHours() + 1)

        calendar.createEvent({
            id,
            start: startDate,
            end: endDate,
            summary: eventTitle,
            description,
            location: country,
            url: sourceUrl
        })
    }

    req.header("Content-Type", "text/calendar")
    req.header("Content-Disposition", `attachment; filename=${filename}`)

    return req.text(calendar.toString())
})

async function getEvents() {
    const url = new URL(config.url.events)

    const now = new Date()

    const from = formatISO(startOfWeek(now, { weekStartsOn: 0 }))

    const dayToAdd = config.calendarPreferences.numberOfDays
    const to = formatISO(addDays(new Date(from), dayToAdd))

    const countries = ["AR", "AU", "BR", "CA", "CN", "FR", "DE", "IN", "ID", "IT", "JP", "KR", "MX", "RU", "SA", "ZA", "TR", "GB", "US", "EU"]

    url.searchParams.append("from", from)
    url.searchParams.append("to", to)
    url.searchParams.append("countries", countries.join(","))

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",

                "Referer": config.url.eventsOrigin,
                "Origin": config.url.eventsOrigin
            }
        })

        if (!response.ok) return { success: false, error: true, message: "Error fetching agenda (trading view error)", status: response.status }

        const json = await response.json()
        const events = json.result

        if (!events || events.length === 0) return { success: false, error: true, message: "No events found" }

        return events
    } catch (error) {
        return { message: "Error fetching agenda (can't fetch)", error }
    }
}

// async function fullTranslate(text: string, proxyUrl?: string) {
//     const controller = new AbortController()
//     const timer = setTimeout(() => controller.abort(), 5000)

//     const agent = proxyUrl ? new HttpProxyAgent(proxyUrl) : new HttpProxyAgent(await getProxyUrl())

//     try {
//         const { text: resultText } = await translate(text, {
//             from: "en",
//             to: "fr",
//             fetchOptions: {
//                 headers: {
//                     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//                     "Accept": "application/json, text/javascript, */*; q=0.01",
//                     "Accept-Language": "en-US,en;q=0.9",
//                     "Connection": "keep-alive"
//                 },
//                 signal: controller.signal,
//                 agent: agent
//             }
//         })
    
//         return resultText
//     } catch {
//         console.log("Error translating text, retrying with another proxy")

//         return text
//     } finally {
//         clearTimeout(timer)
//     }
// }

// async function getProxyUrl() {
//     const proxyList = new ProxyList()
//     const proxy = await proxyList.randomFromCache()
//     return proxy.url
// }

export default calendarHono