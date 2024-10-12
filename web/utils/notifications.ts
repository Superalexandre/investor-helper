import Database from "better-sqlite3"
import { getEventsNow } from "@/utils/events.js"
import { drizzle } from "drizzle-orm/better-sqlite3"
import {
	notificationEvent as notificationEventSchema,
	notification as notificationSchema
} from "../../db/schema/notifications.js"
import { and, eq } from "drizzle-orm"
import { sendNotifications } from "@remix-pwa/push"

async function sendNotificationEvent() {
	const actualEvent = await getEventsNow()

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	for (const event of actualEvent) {
		const notificationsFromEvent = await db
			.select()
			.from(notificationEventSchema)
			.where(eq(notificationEventSchema.eventId, event.id))

		for (const notificationEvent of notificationsFromEvent) {
			const notificationInfos = await db
				.select()
				.from(notificationSchema)
				.where(eq(notificationSchema.userId, notificationEvent.userId))

			if (notificationInfos.length === 0) {
				continue
			}

			const notificationInfo = notificationInfos[0]
			if (!notificationInfo) {
				continue
			}

			sendNotification({
				title: "Investor Helper",
				body: `L'événement ${event.title} est sur le point de commencer`,
				data: {
					url: `/calendar/${event.id}`
				},
				endpoint: notificationInfo.endpoint,
				p256dh: notificationInfo.p256dh,
				auth: notificationInfo.auth
			})

			await db
				.delete(notificationEventSchema)
				.where(
					and(
						eq(notificationEventSchema.userId, notificationInfo.userId),
						eq(notificationEventSchema.eventId, event.id)
					)
				)
		}
	}
}

function sendNotification({
	title,
	body,
	data,
	endpoint,
	p256dh,
	auth
}: {
	title: string
	body: string
	// biome-ignore lint/suspicious/noExplicitAny: any
	data: any
	endpoint: string
	p256dh: string
	auth: string
}) {
	try {
		sendNotifications({
			notification: {
				title,
				options: {
					body,
					data
				}
			},
			vapidDetails: {
				publicKey: process.env.NOTIFICATION_PUBLIC_KEY as string,
				privateKey: process.env.NOTIFICATION_PRIVATE_KEY as string
			},
			subscriptions: [
				{
					endpoint,
					keys: {
						p256dh,
						auth
					}
				}
			],
			options: {}
		})
	} catch (error) {
		console.error("Error while sending notification", error)
	}
}

export { sendNotificationEvent }
