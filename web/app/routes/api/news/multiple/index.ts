// import { getLastImportantNews } from "@/utils/news"
import { json, type LoaderFunction, type LoaderFunctionArgs } from "@remix-run/node"
import { getNewsById } from "../../../../../utils/news"

export const loader: LoaderFunction = async({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
        return json({ error: "No id provided" }, { status: 400 })
    }

    const decodedId = Buffer.from(id, "base64").toString("utf-8")
    const articles = decodedId.split(",")

    const news = articles.map((article) => {
        return getNewsById({
            id: article
        })
    })

    const newsPromises = await Promise.all(news)

    return json(newsPromises)
	// const limit = url.searchParams.get("limit") || "10"
	// const parsedLimit = Number.parseInt(limit)

	// // Get the last important news from the last 24 hours
	// const fromNews = new Date()
	// fromNews.setDate(fromNews.getDate() - 1)

	// const toNews = new Date()

	// const news = await getLastImportantNews(fromNews, toNews, 150, parsedLimit)
	
	// return json(news)
}
