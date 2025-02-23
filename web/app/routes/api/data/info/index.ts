import { json } from "@tanstack/start"
import { createAPIFileRoute } from "@tanstack/start/api"
import { parse } from "node-html-parser"
import { fetchSymbol } from "../../../../../utils/tradingview/request"
import getLanguage from "../../../../lib/getLanguage"
import currencies from "../../../../../../lang/currencies"
import { getNewsBySymbol } from "../../../../../utils/news"

export const APIRoute = createAPIFileRoute("/api/data/info")({
    GET: async ({ request }) => {
        const url = new URL(request.url)
        const symbol = url.searchParams.get("symbol")

        if (!symbol) {
            return json({
                error: true,
                success: false,
                message: "Symbol not found"
            }, { status: 404 })
        }

        const languageResult = await getLanguage(request)
        const language = languageResult.split("-")[0]

        const [data, additionalInfo, news] = await Promise.all([
            getInfo({ symbol: symbol, language: language }),
            getAdditionalInfo({ symbol: symbol, language: language }),
            getNewsBySymbol({ symbol: symbol, limit: 3 })
        ])

        if (!data) {
            return json({
                error: true,
                success: false,
                message: "Symbol not found"
            }, { status: 404 })
        }

        const dataCurrency = data.currency as string
        const prettyCurrency = currencies[dataCurrency]?.symbol_native ?? dataCurrency

        return json({
            error: false,
            success: true,
            message: "Data fetched successfully",
            info: {
                ...data,
                additionalInfo: additionalInfo,
                news: news,
                prettyCurrency
            }
        })
    }
})

async function getInfo({ symbol, language }: { symbol: string; language?: string }) {
    const { result } = await fetchSymbol({
        language: language,
        symbol: symbol,
        fields: "all"
    })

    if (!result) {
        return null
    }

    return result as any
}

async function getAdditionalInfo({ symbol, language }: { symbol: string, language: string }) {
    const url = `https://${language}.tradingview.com/symbols/${symbol}/`

    const response = await fetch(url)
    const dataHtml = await response.text()

    const root = parse(dataHtml)
    const content = root.querySelector(".tv-category-content > script[type='application/prs.init-data+json']")

    if (!content) {
        return {
            error: true,
            success: false,
            message: "Symbol not found"
        }
    }

    const text = content.textContent
    const jsonContent = JSON.parse(text)
    const dynamicKey = Object.keys(jsonContent)[0]

    const json = jsonContent[dynamicKey]

    return json.data
}

async function getTechnicalInfo({ symbol }: { symbol: string }) {
    const url = `https://www.tradingview.com/symbols/${symbol}/analysis/`

    const response = await fetch(url)
    const dataHtml = await response.text()

    const root = parse(dataHtml)
    const content = root.querySelector(".tv-category-content > script[type='application/prs.init-data+json']")

    if (!content) {
        return {
            error: true,
            success: false,
            message: "Symbol not found"
        }
    }

    const text = content.textContent
    const jsonContent = JSON.parse(text)

    const dynamicKey = Object.keys(jsonContent)[0]

    const json = jsonContent[dynamicKey]

    return json
}

export { getInfo }