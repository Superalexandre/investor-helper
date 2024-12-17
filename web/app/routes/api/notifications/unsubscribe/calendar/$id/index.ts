import type { ActionFunctionArgs } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notificationEventSchema } from "@/schema/notifications"
// import { generateSubscriptionId } from "@remix-pwa/push"
import { getUser } from "../../../../../../session.server"
import { and, eq } from "drizzle-orm"

export function loader() {
	return null
}

export async function action({ request, params }: ActionFunctionArgs) {
	const { id } = params
	if (!id) {
		return {
			success: false,
			error: true,
			message: "Event id not found"
		}
	}

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const user = await getUser(request)
	if (!user) {
		return {
			success: false,
			error: true,
			message: "User not found"
		}
	}

	await db
		.delete(notificationEventSchema)
		.where(and(eq(notificationEventSchema.userId, user.id), eq(notificationEventSchema.eventId, id)))

	return {
		success: true,
		error: false,
		message: "Notification push unsubscribed"
		// subscriptionId
	}
}
