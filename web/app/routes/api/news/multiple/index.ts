import LZString from "lz-string"
import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"
import { getNewsById } from "../../../../../utils/news"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const encodedId = url.searchParams.get("id")

	if (!encodedId) {
		return { error: "No id provided" }
	}

	// Decompress the ID using LZ-String
	let decodedId: string

	if (encodedId.startsWith("lz:")) {
		const lzId = encodedId.slice(3)
		decodedId = LZString.decompressFromEncodedURIComponent(lzId)
	} else {
		decodedId = Buffer.from(encodedId, "base64").toString("utf-8")
	}

	if (!decodedId) {
		return { error: "Invalid id" }
	}

	const articles = decodedId.split("-")

	if (articles.length === 0) {
		return { error: "No articles provided" }
	}

	const newsPromises = articles.map((article) => getNewsById({ id: article }))

	const newsResults = await Promise.all(newsPromises)
	const newsData = newsResults.filter((news) => news?.news !== undefined)

	if (newsData.length === 0) {
		return { error: "No valid news articles found" }
	}

	return newsData
}
