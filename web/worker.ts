import { serve } from "@hono/node-server"
import app from "./server.js"
import { CronJob } from "cron"
import { saveFetchNews } from "./utils/news.js"
import { saveFetchEvents } from "./utils/events.js"
// import { sendMail } from "./utils/newsLetter.js"

function startServer() {
	serve(
		{
			fetch: app.fetch,
			port: 3000
		},
		(info) => {
			console.log(`Server listening on port ${info.port}`)
		}
	)
}

// function sendNotification() {

//     sendNotifications({
//         subscriptions: [{
//             endpoint: "localhost:3000",
//             keys: {
//                 p256dh: "",
//                 auth: ""
//             }
//         }],
//         vapidDetails,
//         notification,
//     })

// }

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

	// sendMail()
}

try {
	main()
} catch (err) {
	console.error("Error starting server", err)
}

process.on("uncaughtException", (err) => {
	console.error("Erreur non capturée :", err)
})
