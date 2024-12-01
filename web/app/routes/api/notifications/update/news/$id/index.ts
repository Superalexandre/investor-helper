import { type ActionFunctionArgs, json } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notificationSubscribedNewsKeywordsSchema, notificationSubscribedNewsSchema } from "@/schema/notifications"
// import { generateSubscriptionId } from "@remix-pwa/push"
import { getUser } from "../../../../../../session.server"
import { and, eq } from "drizzle-orm"

export function loader() {
	return null
}

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.formData()

	const { id } = params
	if (!id) {
		return json({
			success: false,
			error: true,
			message: "News id not found"
		})
	}

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

	// Update the keyWords
	// const keysWords = request.body.get("keywords") ? request.body.get("keywords") as string : null
	const keysWords = formData.get("keywords") ? (formData.get("keywords") as string) : ""

	const actualKeywords = await db
		.select()
		.from(notificationSubscribedNewsKeywordsSchema)
		.where(eq(notificationSubscribedNewsKeywordsSchema.notificationId, id))

	const keys = keysWords.split(",")
	for (const key of keys) {
		if (!actualKeywords.find((k) => k.keyword === key.trim())) {
			await db.insert(notificationSubscribedNewsKeywordsSchema).values({
				notificationId: id,
				keyword: key.trim()
			})
		}
	}

	for (const key of actualKeywords) {
		if (!keys.find((k) => k.trim() === key.keyword)) {
			await db
				.delete(notificationSubscribedNewsKeywordsSchema)
				.where(
					and(
						eq(notificationSubscribedNewsKeywordsSchema.notificationId, id),
						eq(notificationSubscribedNewsKeywordsSchema.keyword, key.keyword)
					)
				)
		}
	}

	// Update the name
	const name = formData.get("name") as string

	await db
		.update(notificationSubscribedNewsSchema)
		.set({ name })
		.where(
			and(
				eq(notificationSubscribedNewsSchema.userId, user.id),
				eq(notificationSubscribedNewsSchema.notificationId, id)
			)
		)

	return json({
		success: true,
		error: false,
		message: "Notification push updated"
		// subscriptionId
	})
}
