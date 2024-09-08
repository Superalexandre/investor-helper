import { Hono } from "hono"
import { cors } from "hono/cors"
// import { parse } from "node-html-parser"
// import config from "../config"

import calendar from "./api/calendar"
import news from "./api/news"

const app = new Hono()
    .use(cors())
    .route("/api/calendar", calendar)
    .route("/api/news", news)

export default app