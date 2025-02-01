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

app.use(compress())
app.use((c, next) => {
	c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	c.header(
		"Content-Security-Policy",
		"default-src 'self'; script-src 'self'; connect-src 'self' https://static.cloudflareinsights.com https://api.dicebear.com; object-src 'none'; style-src 'self'; img-src 'self';"
	)
	c.header("X-Frame-Options", "SAMEORIGIN")
	c.header("X-Content-Type-Options", "nosniff")
	c.header("Referrer-Policy", "no-referrer-when-downgrade")
	c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

	return next()
})

app.route("/api/calendar", calendar)

app.use(
	"*",
	serveStatic({ root: "./build/client", onFound: (_path, c) => c.header("Cache-Control", "public, max-age=3600") })
)
// app.use(
// 	"/build/*",
// 	serveStatic({
// 		root: isDev ? "./public/build" : "./build/client",
// 		onFound: (_path, c) => c.header("Cache-Control", "public, immutable, max-age=31536000")
// 	})
// )
app.use(
	"/assets/*",
	serveStatic({
		root: isDev ? "./public/assets" : "./build/client/assets",
		onFound: (_path, c) => c.header("Cache-Control", "public, immutable, max-age=31536000")
	})
)
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
