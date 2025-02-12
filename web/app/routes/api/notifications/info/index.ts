import type { LoaderFunction } from "@remix-run/node"
import { getUser } from "../../../../session.server"
import { getUserNotifications } from "../../../../../utils/notifications"

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request)

	if (!user) {
		return {
			error: true,
			success: false,
			message: "User not found"
		}
	}

	const { notifications, calendarNotifications, subscribedNews, fullSubscribedNews } =
		await getUserNotifications(user)

	return {
		error: false,
		success: true,
		message: "Notifications found",
        data: {
            notifications,
            calendarNotifications,
            subscribedNews,
            fullSubscribedNews
        }
	}
}
