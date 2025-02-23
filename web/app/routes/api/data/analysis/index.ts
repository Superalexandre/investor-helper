import { json } from "@tanstack/start"
import { createAPIFileRoute } from "@tanstack/start/api"
import { generateAnalysis } from "../../../../../utils/ai/analysis/stocks/generate"

const cache = new Map<
	string,
	{
		recommendation: string
		confidence: number
		fr: {
			beginner: { reason: string }
			advanced: { reason: string }
		}
		en: {
			beginner: { reason: string }
			advanced: { reason: string }
		}
		updated: Date
	}
>()

export const APIRoute = createAPIFileRoute("/api/data/analysis")({
	GET: async ({ request }) => {
		const url = new URL(request.url)
		const symbol = url.searchParams.get("symbol")

		if (!symbol) {
			return json(
				{
					error: true,
					success: false,
					message: "Symbol not found"
				},
				{ status: 400 }
			)
		}

		// TODO: Check if the symbol is valid

		// Vérifier si l'analyse est déjà en cache
		if (cache.has(symbol)) {
			const analysis = cache.get(symbol)

			if (!analysis) {
				return json(
					{
						error: true,
						success: false,
						message: "Error fetching analysis from cache"
					},
					{ status: 500 }
				)
			}

			// Si l'analyse a été mise à jour dans les dernières 24 heures, la retourner
			const maxAge = 1000 * 60 * 60 * 24
			if (analysis.updated.getTime() > Date.now() - maxAge) {
				return json({
					error: false,
					success: true,
					message: "Data fetched successfully",
					analysis: analysis
				})
			}
		} else {
			cache.delete(symbol)

			const analysis = await generateAnalysis({ symbol: symbol })

			if (!analysis) {
				return json(
					{
						error: true,
						success: false,
						message: "Error generating analysis"
					},
					{ status: 500 }
				)
			}

			const jsonAnalysis = analysis.json

			cache.set(symbol, {
				...jsonAnalysis,
				updated: new Date()
			})
		}

		const analysis = cache.get(symbol)

		if (!analysis) {
			return json(
				{
					error: true,
					success: false,
					message: "Error generating analysis"
				},
				{ status: 500 }
			)
		}

		return json({
			error: false,
			success: true,
			message: "Data fetched successfully",
			analysis: analysis
		})
	}
})
