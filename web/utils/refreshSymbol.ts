import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { symbols as symbolsSchema } from "../../db/schema/symbols.js"
import { eq } from "drizzle-orm"

export default async function refreshSymbol({
    symbolId
}: {
    symbolId: string
}) {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    // Check if the symbol exist in the symbols table
    const symbolExists = await db
        .select()
        .from(symbolsSchema)
        .where(eq(symbolsSchema.symbolId, symbolId))

    if (symbolExists && symbolExists.length > 0) {
        // Update the symbol
        const lastUpdate = symbolExists[0].lastUpdate
        const now = new Date().toISOString()

        // Check if the symbol was updated in the last 10 minutes
        const lastUpdateDate = new Date(lastUpdate)
        const nowDate = new Date(now)

        const diff = nowDate.getTime() - lastUpdateDate.getTime()
        const diffMinutes = Math.floor(diff / 1000 / 60)

        console.log(`Symbol ${symbolId} was last updated ${diffMinutes} minutes ago`)

        if (diffMinutes < 10) return

        const symbolData = await getSymbolData(symbolId)

        await db
            .update(symbolsSchema)
            .set({
                lastUpdate: now,
                high1M: symbolData["High.1M"],
                low1M: symbolData["Low.1M"],
                perf1M: symbolData["Perf.1M"],
                perf3M: symbolData["Perf.3M"],
                perf6M: symbolData["Perf.6M"],
                perfW: symbolData["Perf.W"],
                perfY: symbolData["Perf.Y"],
                perfYTD: symbolData["Perf.YTD"],
                recommendAll: symbolData["Recommend.All"],
                averageVolume10dCalc: symbolData["average_volume_10d_calc"],
                averageVolume30dCalc: symbolData["average_volume_30d_calc"],
                country: symbolData["country"],
                countryCodeFund: symbolData["country_code_fund"],
                logoid: symbolData["logoid"],
                market: symbolData["market"],
                price52WeekHigh: symbolData["price_52_week_high"],
                price52WeekLow: symbolData["price_52_week_low"],
                sector: symbolData["sector"],
                name: symbolData["description"],
            })
            .where(eq(symbolsSchema.symbolId, symbolId))
        return
    } else {
        const symbolData = await getSymbolData(symbolId)

        if (!symbolData) {
            await db
                .insert(symbolsSchema)
                .values({
                    name: symbolId,
                    symbolId: symbolId,
                })
            
            return
        }

        await db
            .insert(symbolsSchema)
            .values({
                name: symbolData["description"] || symbolId,
                logoid: symbolData["logoid"],
                symbolId: symbolId,
                high1M: symbolData["High.1M"],
                low1M: symbolData["Low.1M"],
                perf1M: symbolData["Perf.1M"],
                perf3M: symbolData["Perf.3M"],
                perf6M: symbolData["Perf.6M"],
                perfW: symbolData["Perf.W"],
                perfY: symbolData["Perf.Y"],
                perfYTD: symbolData["Perf.YTD"],
                recommendAll: symbolData["Recommend.All"],
                averageVolume10dCalc: symbolData["average_volume_10d_calc"],
                averageVolume30dCalc: symbolData["average_volume_30d_calc"],
                country: symbolData["country"],
                countryCodeFund: symbolData["country_code_fund"],
                market: symbolData["market"],
                price52WeekHigh: symbolData["price_52_week_high"],
                price52WeekLow: symbolData["price_52_week_low"],
                sector: symbolData["sector"],
            })
        
        return
    }
}

async function getSymbolData(symbolId: string) {

    const fields = [
        "High.1M",
        "Low.1M",
        "Perf.1M",
        "Perf.3M",
        "Perf.6M",
        "Perf.W",
        "Perf.Y",
        "Perf.YTD",
        "Recommend.All",
        "average_volume_10d_calc",
        "average_volume_30d_calc",
        "country",
        "country_code_fund",
        "market",
        "nav_discount_premium",
        "open_interest",
        "price_52_week_high",
        "price_52_week_low",
        "sector",
        "logoid",
        "name",
        "description",
    ]

    console.log(`Getting data for symbol ${symbolId}`)

    const url = `https://scanner.tradingview.com/symbol?symbol=${symbolId}&fields=${fields.join("%2C")}&no_404=true&label-product=right-details`

    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
        }
    })

    const data = await res.json()

    console.log(data)

    return data
}