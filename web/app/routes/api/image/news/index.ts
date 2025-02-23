import { createAPIFileRoute } from "@tanstack/start/api"

export const APIRoute = createAPIFileRoute("/api/image/news")({
	GET: async ({ request }) => {
		const requestUrl = new URL(request.url)
		const imageName = requestUrl.searchParams.get("name")

		if (!imageName) {
			return new Response(null, {
				status: 400
			})
		}

		const url = `https://s3.tradingview.com/news/image/${imageName}-resized.jpeg`
		const imageReq = await fetch(url)

		if (!imageReq.ok) {
			return new Response(null, {
				status: 404
			})
		}

		const imageBlob = await imageReq.blob()
		return new Response(imageBlob, {
			headers: {
				"Content-Type": "image/jpeg"
			}
		})
	}
})
