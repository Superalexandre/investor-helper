import type { ActionFunctionArgs } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notificationSubscribedNewsKeywordsSchema, notificationSubscribedNewsSchema } from "@/schema/notifications"
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
			message: "News id not found"
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
		.delete(notificationSubscribedNewsKeywordsSchema)
		.where(and(eq(notificationSubscribedNewsKeywordsSchema.notificationId, id)))

	await db
		.delete(notificationSubscribedNewsSchema)
		.where(
			and(
				eq(notificationSubscribedNewsSchema.userId, user.id),
				eq(notificationSubscribedNewsSchema.notificationId, id)
			)
		)

	return {
		success: true,
		error: false,
		message: "Notification push unsubscribed"
		// subscriptionId
	}
}
