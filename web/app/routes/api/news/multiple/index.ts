import { createAPIFileRoute } from "@tanstack/start/api"
import LZString from "lz-string"
import { getNewsById } from "../../../../../utils/news"

export const APIRoute = createAPIFileRoute("/api/news/multiple")({
	GET: async ({ request }) => {
		const url = new URL(request.url)
		const encodedId = url.searchParams.get("id")

		if (!encodedId) {
			return new Response(JSON.stringify({ error: "No id provided" }), {
				headers: {
					"Content-Type": "application/json"
				},
				status: 400
			})
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
			return new Response(JSON.stringify({ error: "Invalid id" }), {
				headers: {
					"Content-Type": "application/json"
				},
				status: 400
			})
		}

		const articles = decodedId.split("-")

		if (articles.length === 0) {
			return new Response(JSON.stringify({ error: "No articles provided" }), {
				headers: {
					"Content-Type": "application/json"
				},
				status: 400
			})
		}

		const newsPromises = articles.map((article) => getNewsById({ id: article }))

		const newsResults = await Promise.all(newsPromises)
		const newsData = newsResults.filter((news) => news?.news !== undefined)

		if (newsData.length === 0) {
			return new Response(JSON.stringify({ error: "No valid news articles found" }), {
				headers: {
					"Content-Type": "application/json"
				},
				status: 404
			})
		}

		return new Response(JSON.stringify(newsData), {
			headers: {
				"Content-Type": "application/json"
			}
		})
	}
})
