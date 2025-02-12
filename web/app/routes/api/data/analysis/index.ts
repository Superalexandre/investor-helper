import type { LoaderFunction } from "@remix-run/node"
import { generateAnalysis } from "../../../../../utils/ai/analysis/stocks/generate"

const cache = new Map<string, {
    recommendation: string
    confidence: number
    fr: {
        beginner: {
            reason: string
        }
        advanced: {
            reason: string
        }
    },
    en: {
        beginner: {
            reason: string
        }
        advanced: {
            reason: string
        }
    },  
    updated: Date
}>()

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	const symbol = url.searchParams.get("symbol")

	if (!symbol) {
		return {
			error: true,
			success: false,
			message: "Symbol not found"
		}
	}

    // TODO: Check if the symbol is valid

    // Check if the analysis is already in the cache
    if (cache.has(symbol)) {
        const analysis = cache.get(symbol)

        if (!analysis) {
            return
        }

        // If the analysis was updated in the last 24 hours, return it
        const maxAge = 1000 * 60 * 60 * 24
        if (analysis.updated.getTime() > Date.now() - maxAge) {
            return {
                error: false,
                success: true,
                message: "Data fetched successfully",
                analysis: analysis
            }
        }
    } else {
        cache.delete(symbol)

        const analysis = await generateAnalysis({ symbol: symbol })

        if (!analysis) {
            return {
                error: true,
                success: false,
                message: "Error generating analysis"
            }
        }

        const jsonAnalysis = analysis.json

        cache.set(symbol, {
            ...jsonAnalysis,
            updated: new Date()
        })
    }

    const analysis = cache.get(symbol)

    if (!analysis) {
        return {
            error: true,
            success: false,
            message: "Error generating analysis"
        }
    }

	return {
		error: false,
		success: true,
		message: "Data fetched successfully",
        analysis: analysis
	}
}