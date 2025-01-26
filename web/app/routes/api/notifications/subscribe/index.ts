import type { ActionFunctionArgs } from "react-router";
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notificationSchema } from "@/schema/notifications"
// import { generateSubscriptionId } from "@remix-pwa/push"
import { v4 as uuid } from "uuid"
import { getUser } from "../../../../session.server"
import { and, eq } from "drizzle-orm"

export function loader() {
	return null
}

export async function action({ request }: ActionFunctionArgs) {
	// Get the body of the request
	const body = await request.json()

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	// const subscriptionId = await generateSubscriptionId(body)

	const subscriptionId = uuid()

	const user = await getUser(request)

	if (!user) {
		return {
			success: false,
			error: true,
			message: "User not found"
		}
	}

	if (!body.endpoint || !body.keys.p256dh || !body.keys.auth) {
		return {
			success: false,
			error: true,
			message: "Missing endpoint, p256dh or auth"
		}
	}

	const isSubscribed = await db
		.select()
		.from(notificationSchema)
		.where(
			and(
				eq(notificationSchema.userId, user.id),
				eq(notificationSchema.endpoint, body.endpoint),
				eq(notificationSchema.p256dh, body.keys.p256dh),
				eq(notificationSchema.auth, body.keys.auth)
			)
		)

	if (isSubscribed.length > 0) {
		return {
			success: false,
			error: true,
			message: "Already subscribed"
		}
	}

	await db.insert(notificationSchema).values({
		userId: user.id,
		// id: subscriptionId,
		endpoint: body.endpoint,
		p256dh: body.keys.p256dh,
		auth: body.keys.auth
	})

	return {
		success: true,
		error: false,
		message: "Notification push",
		subscriptionId
	}
}
