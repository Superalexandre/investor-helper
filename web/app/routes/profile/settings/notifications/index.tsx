import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { redirect } from "@remix-run/react"
import { getUser } from "@/session.server"
import BackButton from "../../../../components/button/backButton"
import { Button } from "../../../../components/ui/button"
import { MdAdd } from "react-icons/md"
import { usePush } from "@remix-pwa/push/client"
import { type ReactNode, useState } from "react"
import DialogNotification from "../../../../components/dialog/dialogNotification"
import DialogNotificationNews from "../../../../components/dialog/dialogNotificationNews"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { NewsNotifications } from "./News"
import { useQuery } from "@tanstack/react-query"
import { CalendarNotifications } from "./Calendar"

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request)

	if (!user) {
		return redirect("/login?redirect=/profile/settings/notifications")
	}

	return null
}

export const meta: MetaFunction = () => {
	return [
		{ title: "Investor Helper - Vos notifications" }
		// { name: "description", content: "Welcome to Remix!" },
	]
}

export default function Index(): ReactNode {
	const {
		data,
		isPending,
		error
	} = useQuery({
		queryKey: ["notificationsInfo"],
		queryFn: async () => await fetch("/api/notifications/info").then(res => res.json()),
		refetchOnWindowFocus: true
	})

	const { isSubscribed } = usePush()

	const [notificationOpen, setNotificationOpen] = useState(false)
	const [notificationNewsOpen, setNotificationNewsOpen] = useState(false)

	if (isPending) {
		return <div>Loading</div>
	}

	if (error || data.error) {
		return <div>Une erreur est survenue</div>
	}

	return (
		<div className="relative flex w-full flex-col items-center overflow-hidden">
			<BackButton />

			<DialogNotification open={notificationOpen} setOpen={setNotificationOpen} />
			<DialogNotificationNews open={notificationNewsOpen} setOpen={setNotificationNewsOpen} type="create" />

			<div className="mt-4 flex w-full flex-col items-center justify-center gap-4 px-4">
				<Card className="w-full">
					<CardHeader>
						<CardTitle>Notifications du calendrier</CardTitle>
					</CardHeader>
					<CardContent>
						<CalendarNotifications calendarNotifications={data.data.calendarNotifications} />
					</CardContent>
				</Card>


				<Card className="w-full">
					<CardHeader>
						<CardTitle>Notifications d'actualités</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<NewsNotifications news={data.data.fullSubscribedNews} />

						<div className="flex flex-row items-center justify-end gap-4">
							<Button
								className="flex flex-row items-center justify-center gap-2"
								onClick={(): void => {
									if (isSubscribed) {
										setNotificationNewsOpen(true)
									} else {
										setNotificationOpen(true)
									}
								}}
							>
								Ajouter une notification
								<MdAdd />
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}