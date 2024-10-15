import Database from "better-sqlite3"
import { getEventsNow } from "./events.js"
import { drizzle } from "drizzle-orm/better-sqlite3"
import {
	notificationEvent as notificationEventSchema,
	notification as notificationSchema,
	type NotificationSubscribedNews,
	notificationSubscribedNews,
	type NotificationSubscribedNewsKeywords,
	notificationSubscribedNewsKeywords,
	type NotificationSubscribedNewsSymbols,
	notificationSubscribedNewsSymbols
} from "../../db/schema/notifications.js"
import { and, eq } from "drizzle-orm"
import { sendNotifications } from "@remix-pwa/push"
import type { User } from "../../db/schema/users.js"
import { events } from "../../db/schema/events.js"

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

			for (const notificationInfo of notificationInfos) {
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
			}

			await db
				.delete(notificationEventSchema)
				.where(
					and(
						eq(notificationEventSchema.userId, notificationEvent.userId),
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
					badge: "/logo-128-128.png",
					icon: "/logo-128-128.png",
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

interface FullSubscribedNews extends NotificationSubscribedNews {
	keywords: NotificationSubscribedNewsKeywords[]
	symbols: NotificationSubscribedNewsSymbols[]
}

async function getUserNotifications(user: User) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const notifications = await db
		.select()
		.from(notificationSchema)
		.where(eq(notificationSchema.userId, user.id))

	const calendarNotifications = await db
		.select()
		.from(notificationEventSchema)
		.innerJoin(events, eq(notificationEventSchema.eventId, events.id))
		.where(eq(notificationEventSchema.userId, user.id))

	const subscribedNews = await db
		.select()
		.from(notificationSubscribedNews)
		.where(eq(notificationSubscribedNews.userId, user.id))

	const fullSubscribedNews: FullSubscribedNews[] = []

	for (const news of subscribedNews) {
		const keywords = await db
			.select()
			.from(notificationSubscribedNewsKeywords)
			.where(eq(notificationSubscribedNewsKeywords.notificationId, news.notificationId))

		const symbols = await db
			.select()
			.from(notificationSubscribedNewsSymbols)
			.where(eq(notificationSubscribedNewsSymbols.notificationId, news.notificationId))

		fullSubscribedNews.push({
			...news,
			keywords: keywords,
			symbols: symbols
		})
	}


	return {
		notifications,
		calendarNotifications,
		subscribedNews,
		fullSubscribedNews
	}
}

export { sendNotification, sendNotificationEvent, getUserNotifications }
