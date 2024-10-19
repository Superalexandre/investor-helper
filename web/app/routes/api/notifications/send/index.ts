import { notificationSchema } from "@/schema/notifications"
import { sendNotifications } from "@remix-pwa/push"
import type { LoaderFunctionArgs } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

export async function loader({ request }: LoaderFunctionArgs) {
	const isProduction = process.env.NODE_ENV === "production"

	// Get the key from the search params
	const url = new URL(request.url)
	const searchParams = url.searchParams

	const key = searchParams.get("key")

	if (isProduction && key !== process.env.NOTIFICATION_ADMIN_KEY) {
		return new Response("Unauthorized", { status: 401 })
	}

	// Wait 10 seconds before sending the notification
	await new Promise((resolve) => setTimeout(resolve, 2000))

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const allSubscriptions = await db.select().from(notificationSchema)

	for (const subscription of allSubscriptions) {
		try {
			sendNotifications({
				notification: {
					title: "Investor Helper",
					options: {
						body: "Un nouvel article d'Apple est disponible",
						badge: "/calendarIcon.svg",
						data: {
							url: "/news"
						}
					}
				},
				vapidDetails: {
					publicKey: process.env.NOTIFICATION_PUBLIC_KEY as string,
					privateKey: process.env.NOTIFICATION_PRIVATE_KEY as string
				},
				subscriptions: [
					{
						endpoint: subscription.endpoint,
						keys: {
							p256dh: subscription.p256dh,
							auth: subscription.auth
						}
					}
				],
				options: {}
			})
		} catch (error) {
			console.error("Error while sending notification", error)
		}
	}

	return null
}
