import { serveStatic } from "@hono/node-server/serve-static"
import type { AppLoadContext } from "@remix-run/node"
import { Hono } from "hono"
import { compress } from "hono/compress"
import { remix } from "remix-hono/handler"

import calendar from "./api/calendar.js"
// import news from "./api/news.js"
// import search from "./app/routes/api/search.js"
import "dotenv/config"

const isDev = process.env.NODE_ENV === "development"

const app = new Hono()

console.log("NODE_ENV", process.env.NODE_ENV)

app.use(compress())
app.route("/api/calendar", calendar)
// app.route("/api/news", news)
// app.route("/api/search", search)
app.use("/*", serveStatic({ root: "./build/client" }))
app.use("/build/*", serveStatic({ root: isDev ? "./public/build" : "./build/client" }))
app.use("/assets/*", serveStatic({ root: isDev ? "./public/assets" : "./build/client/assets" }))
app.use(async (c, next) => {
    const path = "./build/server/index.js"
    const build = await import(path)

    return remix({
        build: build,
        mode: isDev ? "development" : "production",
        getLoadContext: () => {
            return {} satisfies AppLoadContext
        }
    })(c, next)
})

export default app