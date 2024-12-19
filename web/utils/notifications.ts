import Database from "better-sqlite3"
import { getEventsNow } from "./events.js"
import { drizzle } from "drizzle-orm/better-sqlite3"
import {
	notificationEventSchema,
	notificationSchema,
	notificationSubscribedNewsSchema,
	notificationSubscribedNewsKeywordsSchema,
	notificationSubscribedNewsSymbolsSchema,
	notificationListSchema
} from "../../db/schema/notifications.js"
import { and, eq, gte } from "drizzle-orm"
import { sendNotifications } from "@remix-pwa/push"
import type { User } from "../../db/schema/users.js"
import { eventsSchema } from "../../db/schema/events.js"
import type { NotificationSubscribedFullNews } from "../types/Notifications.js"
import { v4 as uuidv4 } from "uuid"

async function sendNotificationEvent() {
	const actualEvent = await getEventsNow()

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	for (const event of actualEvent) {
		const notificationsFromEvent = await db
			.select()
			.from(notificationEventSchema)
			.where(eq(notificationEventSchema.eventId, event.id))

		const title = "Investor Helper"
		const body = `L'événement ${event.title} est sur le point de commencer`
		const url = `/calendar/${event.id}`

		for (const notificationEvent of notificationsFromEvent) {
			const notificationInfos = await db
				.select()
				.from(notificationSchema)
				.where(eq(notificationSchema.userId, notificationEvent.userId))

			// Insert into the database
			addNotificationList({
				userId: notificationEvent.userId,
				title: title,
				body: body,
				url: url,
				type: "event",
				notificationFromId: notificationEvent.eventId
			})

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

async function getUserNotifications(user: User) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const notifications = await db.select().from(notificationSchema).where(eq(notificationSchema.userId, user.id))

	const calendarNotifications = await db
		.select()
		.from(notificationEventSchema)
		.innerJoin(eventsSchema, eq(notificationEventSchema.eventId, eventsSchema.id))
		.where(and(eq(notificationEventSchema.userId, user.id), gte(eventsSchema.date, new Date().toISOString())))

	const subscribedNews = await db
		.select()
		.from(notificationSubscribedNewsSchema)
		.where(eq(notificationSubscribedNewsSchema.userId, user.id))

	const fullSubscribedNews: NotificationSubscribedFullNews[] = []

	for (const news of subscribedNews) {
		const keywords = await db
			.select()
			.from(notificationSubscribedNewsKeywordsSchema)
			.where(eq(notificationSubscribedNewsKeywordsSchema.notificationId, news.notificationId))

		const symbols = await db
			.select()
			.from(notificationSubscribedNewsSymbolsSchema)
			.where(eq(notificationSubscribedNewsSymbolsSchema.notificationId, news.notificationId))

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

async function addNotificationList({
	userId,
	notificationFromId,
	type,
	title,
	body,
	url,
	icon,
	image
}: {
	userId: string
	notificationFromId: string
	type: "news" | "event"
	title: string
	body: string
	url: string
	icon?: string
	image?: string
}) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	console.log(`Inserting ${title} in ${userId} notifications`)

	// Create new uuid
	const notificationId = uuidv4()

	// Insert notification
	await db.insert(notificationListSchema).values({
		userId: userId,
		notificationId,
		notificationFromId,
		type,
		title,
		body,
		url,
		icon,
		image,
		isRead: false
	})
}

async function getNotificationList(userId: string) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const notifications = await db
		.select()
		.from(notificationListSchema)
		.where(eq(notificationListSchema.userId, userId))

	return notifications
}

export { sendNotification, sendNotificationEvent, getUserNotifications, addNotificationList, getNotificationList }
