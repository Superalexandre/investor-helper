import { type ActionFunctionArgs, json } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import {
	notificationSubscribedNewsSchema,
    notificationSubscribedNewsKeywordsSchema
} from "@/schema/notifications"
// import { generateSubscriptionId } from "@remix-pwa/push"
import { getUser } from "../../../../../session.server"
import { v4 as uuid } from "uuid"

export function loader() {
	return null
}

export async function action({ request }: ActionFunctionArgs) {
    // Get the body of the request
    const formData = await request.formData()

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const user = await getUser(request)
	if (!user) {
		return json({
			success: false,
			error: true,
			message: "User not found"
		})
	}

	if (!formData.has("name")) {
		return json({
			success: false,
			error: true,
			message: "Name is required"
		})
	}

	const name = formData.get("name") as string
    const keysWords = formData.get("keywords") ? formData.get("keywords") as string : null

    const notificationId = uuid()
    await db.insert(notificationSubscribedNewsSchema)
        .values({
            userId: user.id,
            notificationId: notificationId,
			name: name,
        })

    if (keysWords) {
        const keys = keysWords.split(",")
        for (const key of keys) {
            await db.insert(notificationSubscribedNewsKeywordsSchema)
                .values({
                    notificationId: notificationId,
                    keyword: key.trim(),
                })
        }
    }

	// Check if the user is already subscribed to the notification
	// const pushSubscription = body.pushSubscription

	// const isSubscribed = await db
	// 	.select()
	// 	.from(notificationSchema)
	// 	.where(
	// 		and(
	// 			eq(notificationSchema.userId, user.id),
	// 			eq(notificationSchema.endpoint, pushSubscription.endpoint),
	// 			eq(notificationSchema.p256dh, pushSubscription.keys.p256dh),
	// 			eq(notificationSchema.auth, pushSubscription.keys.auth)
	// 		)
	// 	)

	// if (isSubscribed.length <= 0) {
	// 	await db.insert(notificationSchema).values({
	// 		userId: user.id,
	// 		endpoint: pushSubscription.endpoint,
	// 		p256dh: pushSubscription.keys.p256dh,
	// 		auth: pushSubscription.keys.auth
	// 	})
	// }

	// Check if the event is passed
    /*
	const event = await db
		.select()
		.from(events)
		.where(eq(events.id, id))

	if (event.length <= 0) {
		return json({
			success: false,
			error: true,
			message: "Event not found"
		})
	}

	const eventDate = new Date(event[0].date)
	const now = new Date()

	if (eventDate.getTime() < now.getTime()) {
		return json({
			success: false,
			error: true,
			message: "Event already passed"
		})
	}

	const notification = await db
		.select()
		.from(notificationEventSchema)
		.where(and(eq(notificationEventSchema.userId, user.id), eq(notificationEventSchema.eventId, id)))

	if (notification.length > 0) {
		return json({
			success: false,
			error: true,
			message: "Notification already subscribed"
		})
	}

	await db.insert(notificationEventSchema).values({
		userId: user.id,
		eventId: id,
		remindThirtyMinutesBefore: body.remindThirtyMinutesBefore,
		remindOnTime: body.remindOnTime
	})
    */

	return json({
		success: true,
		error: false,
		message: "Notification push subscribed"
		// subscriptionId
	})
}
