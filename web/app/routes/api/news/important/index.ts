import { getLastImportantNews } from "@/utils/news"
import type { LoaderFunction, LoaderFunctionArgs } from "react-router";

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const limit = url.searchParams.get("limit") || "10"
	const parsedLimit = Number.parseInt(limit)

	// Get the last important news from the last 24 hours
	const fromNews = new Date()
	fromNews.setDate(fromNews.getDate() - 1)

	const toNews = new Date()

	const news = await getLastImportantNews(fromNews, toNews, 150, parsedLimit)

	return news
}
