import { notification as notificationSchema } from "@/schema/notifications"
import { sendNotifications } from "@remix-pwa/push"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

export async function loader() {
    if (process.env.NODE_ENV === "production") return null

    // Wait 10 seconds before sending the notification
    await new Promise(resolve => setTimeout(resolve, 2000))

    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const allSubscriptions = await db
        .select()
        .from(notificationSchema)

    for (const subscription of allSubscriptions) {
        console.log("Sending notification to", subscription.endpoint)

        try {
            sendNotifications({
                notification: {
                    title: "Investor Helper",
                    options: {
                        body: "Un nouvel article d'Apple est disponible",
                        data: {
                            url: "/news"
                        }
                    }
                },
                vapidDetails: {
                    publicKey: process.env.NOTIFICATION_PUBLIC_KEY as string,
                    privateKey: process.env.NOTIFICATION_PRIVATE_KEY as string,
                },
                subscriptions: [
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth,
                        }
                    }
                ],
                options: {}
            })
        } catch (error) {
            console.error("Error while sending notification", error)
        }
    }

    return null
}