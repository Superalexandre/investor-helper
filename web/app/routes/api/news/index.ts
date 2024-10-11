import { getNews } from "@/utils/news"
import { json, type LoaderFunction, type LoaderFunctionArgs } from "@remix-run/node"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const limit = url.searchParams.get("limit")
	const page = url.searchParams.get("page")

	const limitReq = limit ? Number.parseInt(limit) : 10
	const pageReq = page ? Number.parseInt(page) : 1

	const news = await getNews({ limit: limitReq, page: pageReq })

	return json(news)
}
