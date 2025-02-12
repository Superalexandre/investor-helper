import type { ActionFunction } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { getUser } from "../../../../../../session.server"
import {
	notificationSubscribedNewsKeywordsSchema,
	notificationSubscribedNewsSchema
} from "../../../../../../../../db/schema/notifications"
import { and, eq } from "drizzle-orm"

const sqlite = new Database("../db/sqlite.db")
const db = drizzle(sqlite)

export const action: ActionFunction = async ({ request }) => {
	const body = await request.json()

	if (!body.id) {
		return {
			error: true,
			success: false,
			message: "News id not found"
		}
	}

	if (!body.keywords) {
		return {
			error: true,
			success: false,
			message: "Keywords not found"
		}
	}

	const user = await getUser(request)

	if (!user) {
		return {
			error: true,
			success: false,
			message: "User not found"
		}
	}

	const newsNotifications = await db
		.select()
		.from(notificationSubscribedNewsSchema)
		.where(eq(notificationSubscribedNewsSchema.notificationId, body.id))

	if (!newsNotifications) {
		return {
			error: true,
			success: false,
			message: "News not found"
		}
	}

	const newsNotification = newsNotifications[0]

	if (newsNotification.userId !== user.id) {
		return {
			error: true,
			success: false,
			message: "News not found"
		}
	}

	const keywords = body.keywords.map((keyword: string) => {
        if (typeof keyword !== "string" || keyword.trim().length < 3 || keyword.trim().length > 100) {
            return ""
        }

        return keyword.trim().toLowerCase()
    }).filter((keyword: string) => keyword !== "")

	const actualKeywords = await db
		.select()
		.from(notificationSubscribedNewsKeywordsSchema)
		.where(eq(notificationSubscribedNewsKeywordsSchema.notificationId, body.id))

	for (const keyword of keywords) {
		// Add the keyword if it doesn't exist
		if (!actualKeywords.find((k) => k.keyword === keyword)) {
			await db.insert(notificationSubscribedNewsKeywordsSchema).values({
				notificationId: body.id,
				keyword
			})
		}
	}

	for (const keyword of actualKeywords) {
		// Remove the keyword if it doesn't exist
		if (!keywords.find((k: string) => k === keyword.keyword)) {
			await db
				.delete(notificationSubscribedNewsKeywordsSchema)
				.where(
					and(
						eq(notificationSubscribedNewsKeywordsSchema.notificationId, body.id),
						eq(notificationSubscribedNewsKeywordsSchema.keyword, keyword.keyword)
					)
				)
		}
	}

	return {
		error: false,
		success: true,
		message: "Keywords updated"
	}
}
