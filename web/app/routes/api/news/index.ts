import { getNews } from "@/utils/news"
import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"
import logger from "../../../../../log"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	// const language = await getLanguage(request)
	const url = new URL(request.url)
	const limit = url.searchParams.get("limit")
	const page = url.searchParams.get("page")
	const languages = url.searchParams.get("languages")?.split(",") || []
	const importances = url.searchParams.get("importances")?.split(",") || []
	const sources = url.searchParams.get("sources")?.split(",") || []

	const limitReq = limit ? Number.parseInt(limit) : 10
	const pageReq = page ? Number.parseInt(page) : 1

	// Transform the importances to the correct score
	const scoreMap: Record<string, number[]> = {
		none: [0, 50],
		low: [50, 100],
		medium: [100, 150],
		high: [150, 200],
		"very-high": [200, 1000]
	}

	const scores = importances.map((importance) => scoreMap[importance])

	// const start = Date.now()
	const news = await getNews({ limit: limitReq, page: pageReq, language: languages, scores: scores, sources: sources })
	// const end = Date.now()

	// logger.info(`News API took ${end - start}ms to respond`)

	// Wait fake 5sec
	// await new Promise((resolve) => setTimeout(resolve, 5000))

	return news
}
