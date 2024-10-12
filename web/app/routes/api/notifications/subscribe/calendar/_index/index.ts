import { type ActionFunctionArgs, json } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notification as notificationSchema } from "@/schema/notifications"
// import { generateSubscriptionId } from "@remix-pwa/push"
import { v4 as uuid } from "uuid"

export function loader() {
	console.log("Notification push")

	return null
}

export function action({ request }: ActionFunctionArgs) {
    return null

    /*
	// Get the body of the request
	const body = await request.json()

	console.log("Subscribe notification", body)

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	// const subscriptionId = await generateSubscriptionId(body)

	const subscriptionId = uuid()

	const user = await getUser(request)

	if (!user) {
		return json({
			success: false,
			error: true,
			message: "User not found"
		})
	}

	if (!body.endpoint || !body.keys.p256dh || !body.keys.auth) {
		return json({
			success: false,
			error: true,
			message: "Missing endpoint, p256dh or auth"
		})
	}

	await db.insert(notificationSchema).values({
		userId: user.id,
		// id: subscriptionId,
		endpoint: body.endpoint,
		p256dh: body.keys.p256dh,
		auth: body.keys.auth
	})

	return json({
		success: true,
		error: false,
		message: "Notification push",
		subscriptionId
	})
    */
}
