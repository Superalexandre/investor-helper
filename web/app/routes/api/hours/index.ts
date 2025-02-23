import { json } from "@tanstack/start"
import { createAPIFileRoute } from "@tanstack/start/api"
import { addDays, formatISO, getDay, isWithinInterval, set, subDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import type { MarketHolidays, MarketHours, MarketsHours, MarketStatus } from "../../../../types/Hours"
import logger from "../../../../../log"

export const APIRoute = createAPIFileRoute("/api/hours")({
    GET: async ({ request }) => {
        const marketsHours: MarketsHours = {
            euronext: {
                id: "euronext",
                name: "Euronext (Paris)",
                open: 9,
                close: 17.5,
                timezone: "Europe/Paris",
                days: [1, 2, 3, 4, 5],
                hasLogo: true
            },
            frankfurt: {
                id: "frankfurt",
                name: "Frankfurt Stock Exchange",
                open: 8,
                close: 16,
                timezone: "Europe/Berlin",
                days: [1, 2, 3, 4, 5],
                hasLogo: false
            },
            london: {
                id: "london",
                name: "London Stock Exchange",
                open: 8.5,
                close: 16.5,
                timezone: "Europe/London",
                days: [1, 2, 3, 4, 5],
                hasLogo: true
            },
            nyse: {
                id: "nyse",
                name: "New York Stock Exchange",
                open: 9.5,
                close: 16,
                timezone: "America/New_York",
                days: [1, 2, 3, 4, 5],
                hasLogo: true
            },
            nasdaq: {
                id: "nasdaq",
                name: "Nasdaq",
                open: 9.5,
                close: 16,
                timezone: "America/New_York",
                days: [1, 2, 3, 4, 5],
                hasLogo: true
            },
            tokyo: {
                id: "tokyo",
                name: "Tokyo Stock Exchange",
                open: 9,
                close: 15,
                lunch: { start: 11.5, end: 12.5 },
                timezone: "Asia/Tokyo",
                days: [1, 2, 3, 4, 5],
                hasLogo: false
            },
            hongkong: {
                id: "hongkong",
                name: "Hong Kong Stock Exchange",
                open: 9.5,
                close: 16,
                lunch: { start: 12, end: 13 },
                timezone: "Asia/Hong_Kong",
                days: [1, 2, 3, 4, 5],
                hasLogo: false
            },
            sydney: {
                id: "sydney",
                name: "Australian Securities Exchange",
                open: 10,
                close: 16,
                timezone: "Australia/Sydney",
                days: [1, 2, 3, 4, 5],
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

        const status = Object.values(marketsHours).map((market) => getMarketStatus(market, marketHolidays))

        return json(status)
    }
})

function isHoliday(holidaysList: MarketHolidays, marketId: string, date: Date): boolean {
    const holidays = holidaysList[marketId] || []
    const formattedDate = formatISO(date, { representation: "date" })
    return holidays.includes(formattedDate)
}

function getMarketStatus(market: MarketHours, holidays: MarketHolidays): MarketStatus {
    const now = toZonedTime(new Date(), market.timezone)
    const currentDay = getDay(now)
    const isWeekend = !market.days.includes(currentDay === 0 ? 7 : currentDay)

    let closeReason: "lunch" | "weekend" | "close" | "holiday" | null = null
    let isOpen = false

    if (isWeekend) {
        closeReason = "weekend"
    } else if (isHoliday(holidays, market.id, now)) {
        closeReason = "holiday"
    } else {
        const { isOpen: open, closeReason: reason } = checkMarketHours(market, now)
        isOpen = open
        closeReason = reason
    }

    const nextOpenDate = getNextOpenDate(market, now, isOpen)
    const nextCloseDate = getNextCloseDate(market, now, isOpen)

    return {
        marketId: market.id,
        marketName: market.name,
        open: isOpen,
        closeReason: closeReason || "close",
        openHour: market.open,
        closeHour: market.close,
        nextOpenDate: nextOpenDate ? new Date(nextOpenDate) : new Date(),
        nextCloseDate: nextCloseDate ? new Date(nextCloseDate) : new Date(),
        hasLogo: market.hasLogo,
        timezone: market.timezone
    } as MarketStatus
}

function checkMarketHours(
    market: MarketHours,
    now: Date
): { isOpen: boolean; closeReason: "lunch" | "weekend" | "close" | "holiday" | null } {
    const marketOpen = set(now, {
        hours: Math.floor(market.open),
        minutes: (market.open % 1) * 60,
        seconds: 0,
        milliseconds: 0
    })

    const marketClose = set(now, {
        hours: Math.floor(market.close),
        minutes: (market.close % 1) * 60,
        seconds: 0,
        milliseconds: 0
    })

    let isOpen = false
    let closeReason: "lunch" | "weekend" | "close" | "holiday" | null = null

    if (market.lunch) {
        const lunchStart = set(now, {
            hours: Math.floor(market.lunch.start),
            minutes: (market.lunch.start % 1) * 60,
            seconds: 0,
            milliseconds: 0
        })

        const lunchEnd = set(now, {
            hours: Math.floor(market.lunch.end),
            minutes: (market.lunch.end % 1) * 60,
            seconds: 0,
            milliseconds: 0
        })

        if (isWithinInterval(now, { start: marketOpen, end: lunchStart })) {
            isOpen = true
        } else if (isWithinInterval(now, { start: lunchEnd, end: marketClose })) {
            isOpen = true
        } else if (now < lunchStart) {
            closeReason = "lunch"
        }
    } else if (isWithinInterval(now, { start: marketOpen, end: marketClose })) {
        isOpen = true
    }

    if (!isOpen && closeReason === null) {
        closeReason = now < marketOpen ? "close" : "close"
    }

    return { isOpen, closeReason }
}

function getNextOpenDate(market: MarketHours, now: Date, isOpen: boolean): string | null {
    if (!isOpen) {
        const isWeekend = getDay(now) === 6 || getDay(now) === 0

        if (!isWeekend && now < set(now, { hours: Math.floor(market.open), minutes: (market.open % 1) * 60 })) {
            return formatISO(set(now, { hours: Math.floor(market.open), minutes: (market.open % 1) * 60 }))
        }

        let dayToAdd = 1

        if (getDay(now) === 5) {
            dayToAdd = 3
        } else if (getDay(now) === 6) {
            dayToAdd = 2
        }

        return formatISO(addDays(set(now, { hours: Math.floor(market.open), minutes: (market.open % 1) * 60 }), dayToAdd))
    }
    return null
}

function getNextCloseDate(market: MarketHours, now: Date, isOpen: boolean): string | null {
    if (isOpen) {
        if (
            market.lunch &&
            now < set(now, { hours: Math.floor(market.lunch.start), minutes: (market.lunch.start % 1) * 60 })
        ) {
            return formatISO(
                set(now, { hours: Math.floor(market.lunch.start), minutes: (market.lunch.start % 1) * 60 })
            )
        }

        return formatISO(set(now, { hours: Math.floor(market.close), minutes: (market.close % 1) * 60 }))
    }
    return null
}