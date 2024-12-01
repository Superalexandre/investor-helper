import { serve } from "@hono/node-server"
import app from "./server.js"
import { CronJob } from "cron"
import { saveFetchNews } from "./utils/news.js"
import { saveFetchEvents } from "./utils/events.js"
import { sendNotificationEvent } from "./utils/notifications.js"
// import { sendMail } from "./utils/newsLetter.js"

function startServer() {
	serve(
		{
			fetch: app.fetch,
			port: Number(process.env.PORT) || 3000
		},
		(info) => {
			console.log(`Server listening on port ${info.port}`)
		}
	)
}

function main() {
	startServer()

	CronJob.from({
		cronTime: "*/5 * * * *",
		onTick: () => {
			saveFetchNews()
			saveFetchEvents()
		},
		start: true,
		timeZone: "Europe/Paris"
	})

	CronJob.from({
		cronTime: "* * * * *",
		onTick: () => {
			sendNotificationEvent()
		},
		start: true,
		timeZone: "Europe/Paris"
	})
}

try {
	main()
} catch (err) {
	console.error("Error starting server", err)
}

process.on("uncaughtException", (err) => {
	console.error("Erreur non capturée :", err)
})
