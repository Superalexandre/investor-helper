import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "@hono/node-server"
import { parse } from "node-html-parser"
import ical from "ical-generator"
import config from "../config"
import fs from "fs"

import { startOfWeek, formatISO, addDays } from "date-fns"

import countriesFr from "../countries/countries-fr"

const app = new Hono()
app.use(cors())
app.get("/api/calendar", async (req) => {
    const url = new URL("https://economic-calendar.tradingview.com/events")


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

                "Referer": "https://www.tradingview.com/",
                "Origin": "https://www.tradingview.com/"
            }
        })

        if (!response.ok) return req.json({ message: "Error fetching agenda (trading view error)", status: response.status }, 400)

        const json = await response.json()
        const events = json.result

        fs.writeFileSync("events.json", JSON.stringify(events, null, 4))

        if (!events || events.length === 0) return req.json({ message: "No events found" })

        const filename = "calendar.ics"
        const calendar = ical({
            name: "Economic Calendar"
        })

        const preferences = config.calendarPreferences

        for (const event of events) {
            // unit, scale
            const { id, title, country, indicator, comment, period, referenceDate, source, source_url: sourceUrl, actual, previous, forecast, currency, importance, date, unit, scale } = event

            
            // Convert the importance of the event (-1, 0, 1) to a string
            type Importance = -1 | 0 | 1;
            const importanceMap: Record<Importance, string> = {
                [-1]: "low",
                0: "medium",
                1: "high"
            }
            
            const importanceString = importanceMap[importance as Importance] || "medium"
            
            // Check if the importance of the event is in the preferences
            if (!preferences.countries.includes(country) && !preferences.currencies.includes(currency) && !preferences.importances.includes(importanceString)) continue
            
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

            let description = ""

            description += "Importance: " + frenchImportance[importanceString] + "\n\n"

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
                summary: `${stars[importanceString] || ""} ${country} ${title}`,
                description,
                location: country,
                url: sourceUrl
            })
        }

        fs.writeFileSync("calendar.json", JSON.stringify(calendar.toJSON(), null, 4))

        req.header("Content-Type", "text/calendar")
        req.header("Content-Disposition", `attachment; filename=${filename}`)

        return req.text(calendar.toString())
    } catch (error) {
        console.error(error)
        return req.json({ message: "Error fetching agenda (can't fetch)", error })
    }
})
app.get("/api/news", async (res) => {
    const baseURL = "https://fr.tradingview.com"
    const response = await fetch(`${baseURL}/news/markets/`)
    const data = await response.text()

    const root = parse(data)

    // Get the script tag with type="application/prs.init-data+json" inside of the div data-id="react-root"
    const rawNews = root.querySelector("div[data-id='react-root'] script[type='application/prs.init-data+json']")?.text

    if (!rawNews) return res.json({ message: "No news found" })

    const jsonNews = JSON.parse(rawNews)
    const dynamicKey = Object.keys(jsonNews)[0]

    const json = jsonNews[dynamicKey]

    if (!json) return res.json({ message: "No news found" })

    const news = json.blocks[0].news.items

    if (!news || news.length === 0) return res.json({ message: "No news found" })

    return res.json({ message: "Hello from news", news })
})

serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`Server listening on port ${info.port}`)
})

export default app