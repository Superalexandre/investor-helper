import type { ActionFunction } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { getUser } from "../../../../../../session.server"
import {
    notificationSubscribedNewsKeywordsSchema,
    notificationSubscribedNewsSchema
} from "../../../../../../../../db/schema/notifications"
import { eq } from "drizzle-orm"

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

    if (body.active === undefined) {
        return {
            error: true,
            success: false,
            message: "Active not found"
        }
    }

    const active = body.active

    if (Boolean(active) !== active) {
        return {
            error: true,
            success: false,
            message: "Invalid active"
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

    await db
        .update(notificationSubscribedNewsSchema)
        .set({ active })
        .where(eq(notificationSubscribedNewsSchema.notificationId, body.id))

    return {
        error: false,
        success: true,
        message: "Active updated"
    }
}
