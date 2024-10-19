import { type ActionFunctionArgs, json } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notificationSchema } from "@/schema/notifications"
import { and, eq } from "drizzle-orm"

export function loader() {
	return null
}

export async function action({ request }: ActionFunctionArgs) {
	// Get the body of the request
	const body = await request.json()

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	// Delete the subscription
	await db
		.delete(notificationSchema)
		.where(
			and(
				eq(notificationSchema.endpoint, body.pushSubscription.endpoint),
				eq(notificationSchema.p256dh, body.pushSubscription.keys.p256dh),
				eq(notificationSchema.auth, body.pushSubscription.keys.auth)
			)
		)

	return json({
		success: true,
		error: false,
		message: "Notification unsubscribe"
	})
}
