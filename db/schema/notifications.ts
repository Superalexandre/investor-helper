import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { usersSchema } from "./users.js"
import { eventsSchema } from "./events.js"
import { symbolsSchema } from "./symbols.js"

export const notificationSchema = sqliteTable("notifications", {
	userId: text("user_id")
		.references(() => usersSchema.id)
		.notNull(),
	endpoint: text("endpoint").notNull(),
	p256dh: text("p256dh").notNull(),
	auth: text("auth").notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	plateform: text("plateform").default("web").notNull()
})

export type Notifications = typeof notificationSchema.$inferSelect

export const notificationEventSchema = sqliteTable("notification_event", {
	userId: text("user_id")
		.references(() => usersSchema.id)
		.notNull(),
	eventId: text("event_id")
		.references(() => eventsSchema.id)
		.notNull(),
	remindThirtyMinutesBefore: int("remind_thirty_minutes_before", {
		mode: "boolean"
	})
		.notNull()
		.default(false),
	remindOnTime: int("remind_on_time", {
		mode: "boolean"
	})
		.notNull()
		.default(false),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString())
})

export type NotificationEvent = typeof notificationEventSchema.$inferSelect

export const notificationSubscribedNewsSchema = sqliteTable("notification_subscribed_news", {
	userId: text("user_id")
		.references(() => usersSchema.id)
		.notNull(),

	notificationId: text("notification_id").unique().notNull(),

	name: text("name", {
		length: 64
	}).notNull(),

	// importanceMin: int("importance_min"),
	// importanceMax: int("importance_max"),

	// lang: text("lang"),

	// keywords: text("keywords"),

	// symbols: text("symbols"),

	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString())
})

export type NotificationSubscribedNews = typeof notificationSubscribedNewsSchema.$inferSelect

export const notificationSubscribedNewsKeywordsSchema = sqliteTable("notification_subscribed_news_keywords", {
	notificationId: text("notification_id")
		.references(() => notificationSubscribedNewsSchema.notificationId)
		.notNull(),
	keyword: text("keyword").notNull()
})

export type NotificationSubscribedNewsKeywords = typeof notificationSubscribedNewsKeywordsSchema.$inferSelect

export const notificationSubscribedNewsSymbolsSchema = sqliteTable("notification_subscribed_news_symbols", {
	notificationId: text("notification_id")
		.references(() => notificationSubscribedNewsSchema.notificationId)
		.notNull(),
	symbol: text("symbol")
		.references(() => symbolsSchema.symbolId)
		.notNull()
})

export type NotificationSubscribedNewsSymbols = typeof notificationSubscribedNewsSymbolsSchema.$inferSelect

export const notificationListSchema = sqliteTable("notification_list", {
	userId: text("user_id")
		.references(() => usersSchema.id)
		.notNull(),
	notificationId: text("notification_id").unique().notNull(),
	notificationFromId: text("notification_from_id").notNull(),
	type: text("type", {
		enum: ["news", "event"]
	}).notNull(),

	title: text("title").notNull(),
	body: text("body").notNull(),
	url: text("url").notNull(),
	icon: text("icon"),
	image: text("image"),

	isRead: int("is_read", {
		mode: "boolean"
	})
		.notNull()
		.default(false),

	createdAt: text("created_at").$defaultFn(() => new Date().toISOString())
})

export type NotificationList = typeof notificationListSchema.$inferSelect