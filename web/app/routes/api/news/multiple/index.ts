// import { getLastImportantNews } from "@/utils/news"
import type { LoaderFunction, LoaderFunctionArgs } from "react-router";
import { getNewsById } from "../../../../../utils/news"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const id = url.searchParams.get("id")

	if (!id) {
		return { error: "No id provided" }
	}

	const decodedId = Buffer.from(id, "base64").toString("utf-8")

	if (!decodedId) {
		return { error: "Invalid id" }
	}

	const articles = decodedId.split("-")

	if (articles.length === 0) {
		return { error: "No articles provided" }
	}

	const news = articles.map((article) => {
		return getNewsById({
			id: article
		})
	})

	const newsPromises = await Promise.all(news)
	const newsData = newsPromises.filter((news) => news.news !== undefined)

	return newsData
}
