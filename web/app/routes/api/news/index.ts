import { getNews } from "@/utils/news"
import { json, LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const limit = url.searchParams.get("limit")
    const page = url.searchParams.get("page")

    const limitReq = limit ? parseInt(limit) : 10
    const pageReq = page ? parseInt(page) : 1

    const news = await getNews({ limit: limitReq, page: pageReq })

    return json(news)
}