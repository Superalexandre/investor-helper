import { ActionFunctionArgs, json } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { notification as notificationSchema } from "@/schema/notifications"
// import { generateSubscriptionId } from "@remix-pwa/push"

export function loader() {
    console.log("Notification push")

    return null
}

export async function action({ request }: ActionFunctionArgs) {
    // Get the body of the request
    const body = await request.json()

    console.log("Subscribe notification", body)

    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    // const subscriptionId = await generateSubscriptionId(body)

    await db
        .insert(notificationSchema)
        .values({
            // id: subscriptionId,
            endpoint: body.endpoint,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth
        })

    return json({ 
        success: true,
        error: false,
        message: "Notification push"
    })
}