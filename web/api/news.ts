import { Hono } from "hono"
import getNews from "../utils/getNews.js"

const newsHono = new Hono()

newsHono.get("/", async (req) => {
    // Get params from the request
    const { limit, page } = req.req.query()

    const limitReq = limit ? parseInt(limit) : 10
    const pageReq = page ? parseInt(page) : 1

    const news = await getNews({ limit: limitReq, page: pageReq })

    return req.json(news)
})

export default newsHono