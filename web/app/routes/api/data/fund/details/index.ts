import { json } from "@tanstack/start"
import { createAPIFileRoute } from "@tanstack/start/api"
import { parse } from "node-html-parser"

export const APIRoute = createAPIFileRoute("/api/data/fund/details")({
    GET: async ({ request }) => {
        const url = new URL(request.url)
        const symbol = url.searchParams.get("symbol")

        const response = await fetch(`https://tradingview.com/symbols/${symbol}/analysis/`)
        const dataHtml = await response.text()

        const root = parse(dataHtml)

        const content = root.querySelector(".tv-category-content > script[type='application/prs.init-data+json']")

        if (!content) {
            return json({
                error: true,
                success: false,
                message: "Symbol not found"
            }, { status: 404 })
        }

        const text = content.textContent
        const jsonContent = JSON.parse(text)
        const dynamicKey = Object.keys(jsonContent)[0]

        const jsonResult = jsonContent[dynamicKey]

        return json({
            error: false,
            success: true,
            message: "Data fetched successfully",
            data: jsonResult.data.symbol || {}
        })
    }
})