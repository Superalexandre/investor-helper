import type { ActionFunctionArgs } from "react-router";
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notificationEventSchema, notificationSchema } from "@/schema/notifications"
// import { generateSubscriptionId } from "@remix-pwa/push"
import { getUser } from "../../../../../../session.server"
import { and, eq } from "drizzle-orm"
import { eventsSchema } from "../../../../../../../../db/schema/events"

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

	// Get the body of the request
	const body = await request.json()
	if (!body.remindThirtyMinutesBefore || !body.remindOnTime) {
		return {
			success: false,
			error: true,
			message: "Missing remindThirtyMinutesBefore or remindOnTime"
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

	// Check if the user is already subscribed to the notification
	const pushSubscription = body.pushSubscription

	const isSubscribed = await db
		.select()
		.from(notificationSchema)
		.where(
			and(
				eq(notificationSchema.userId, user.id),
				eq(notificationSchema.endpoint, pushSubscription.endpoint),
				eq(notificationSchema.p256dh, pushSubscription.keys.p256dh),
				eq(notificationSchema.auth, pushSubscription.keys.auth)
			)
		)

	if (isSubscribed.length <= 0) {
		await db.insert(notificationSchema).values({
			userId: user.id,
			endpoint: pushSubscription.endpoint,
			p256dh: pushSubscription.keys.p256dh,
			auth: pushSubscription.keys.auth
		})
	}

	// Check if the event is passed
	const events = await db.select().from(eventsSchema).where(eq(eventsSchema.id, id))

	if (events.length <= 0) {
		return {
			success: false,
			error: true,
			message: "Event not found"
		}
	}

	const eventDate = new Date(events[0].date)
	const now = new Date()

	if (eventDate.getTime() < now.getTime()) {
		return {
			success: false,
			error: true,
			message: "Event already passed"
		}
	}

	const notification = await db
		.select()
		.from(notificationEventSchema)
		.where(and(eq(notificationEventSchema.userId, user.id), eq(notificationEventSchema.eventId, id)))

	if (notification.length > 0) {
		return {
			success: false,
			error: true,
			message: "Notification already subscribed"
		}
	}

	await db.insert(notificationEventSchema).values({
		userId: user.id,
		eventId: id,
		remindThirtyMinutesBefore: body.remindThirtyMinutesBefore,
		remindOnTime: body.remindOnTime
	})

	return {
		success: true,
		error: false,
		message: "Notification push subscribed"
		// subscriptionId
	}
}
