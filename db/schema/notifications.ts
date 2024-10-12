import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { users } from "./users.js"
import { events } from "./events.js"

export const notification = sqliteTable("notifications", {
	userId: text("user_id")
		.references(() => users.id)
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

export type Notifications$ = typeof notification.$inferSelect

export const notificationEvent = sqliteTable("notification_event", {
	userId: text("user_id")
		.references(() => users.id)
		.notNull(),
	eventId: text("event_id")
		.references(() => events.id)
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
	createdAt: text("created_at")
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.$defaultFn(() => new Date().toISOString())
})