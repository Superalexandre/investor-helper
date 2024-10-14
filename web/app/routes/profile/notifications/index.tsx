import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, redirect, useFetcher, useLoaderData, useSubmit } from "@remix-run/react"
import { getUser } from "@/session.server"
import BackButton from "../../../components/backButton"
import { getUserNotifications } from "../../../../utils/notifications"
import { Button } from "../../../components/ui/button"
import { MdAdd, MdDelete } from "react-icons/md"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "../../../components/ui/dialog"
import { usePush } from "@remix-pwa/push/client"
import { useState } from "react"
import { Input } from "../../../components/ui/input"

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		return redirect("/login?redirect=/profile/notifications")
	}

	const { notifications, calendarNotifications, subscribedNews, fullSubscribedNews } = await getUserNotifications(user)

	// const { user, wallet, watchList } = await getUser({ id: "62d56f78-1b1b-411f-ba77-59d749e265ed" })

	// if (!user) return redirect("/")

	// return {
	//     user: user,
	//     wallet: wallet,
	//     watchList: watchList
	// }
	return {
		user,
		notifications,
		calendarNotifications,
		subscribedNews,
		fullSubscribedNews
	}
}

export const meta: MetaFunction = () => {
	return [
		{ title: "Investor Helper - Vos notifications" }
		// { name: "description", content: "Welcome to Remix!" },
	]
}

export default function Index() {
	const { calendarNotifications, subscribedNews, fullSubscribedNews } = useLoaderData<typeof loader>()
	const fetcher = useFetcher()

	console.log(subscribedNews)

	const [notificationNewsOpen, setNotificationNewsOpen] = useState(false)

	return (
		<div className="relative flex w-full flex-col items-center overflow-hidden">
			<BackButton />

			<DialogNewNotificationNews open={notificationNewsOpen} setOpen={setNotificationNewsOpen} />

			<div className="mt-4 flex w-full flex-col items-center justify-center gap-10">
				<div className="flex flex-col items-center justify-center gap-4">
					<h1 className="font-bold text-2xl">Notification actualités</h1>

					{/* News */}
					<div className="flex flex-col items-center justify-center gap-2">
						{fullSubscribedNews.length > 0 ? (
							fullSubscribedNews.map((notification) => (
								<div
									key={notification.notificationId}
									className="flex flex-col items-center justify-center gap-2"
								>
									<p>{notification.name}</p>
									<p>{notification.keywords.map((word) => word.keyword).join(", ")}</p>
									<p>{notification.symbols.map((symbol) => symbol.symbol).join(", ")}</p>

									<fetcher.Form
										method="post"
										action={`/api/notifications/unsubscribe/news/${notification.notificationId}`}
									>
										<Button
											type="submit"
											variant="destructive"
											className="flex flex-row items-center justify-center gap-2"
											// onClick={() => deleteNotification(events.id)}
										>
											Supprimer
											<MdDelete />
										</Button>
									</fetcher.Form>
								</div>
							))
						) : (
							<p>Vous n'avez pas de notification de calendrier</p>
						)}
					</div>

					<div className="flex flex-col items-center justify-center gap-2">
						<Button
							className="flex flex-row items-center justify-center gap-2"
							onClick={() => setNotificationNewsOpen(true)}
						>
							Ajouter une notification
							<MdAdd />
						</Button>
					</div>
				</div>

				{/* Calendar */}
				<div className="flex flex-col items-center justify-center gap-4">
					<h1 className="font-bold text-2xl">Notification calendrier</h1>

					<div className="flex flex-col items-center justify-center gap-2">
						{calendarNotifications.length > 0 ? (
							calendarNotifications.map(({ events }) => (
								<div key={events.id} className="flex flex-row items-center justify-center gap-2">
									<p>{events.title}</p>

									<fetcher.Form
										method="post"
										action={`/api/notifications/unsubscribe/calendar/${events.id}`}
									>
										<Button
											type="submit"
											variant="destructive"
											className="flex flex-row items-center justify-center gap-2"
											// onClick={() => deleteNotification(events.id)}
										>
											Supprimer
											<MdDelete />
										</Button>
									</fetcher.Form>
								</div>
							))
						) : (
							<p>Vous n'avez pas de notification de calendrier</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

function DialogNewNotificationNews({
	open,
	setOpen
}: {
	open: boolean
	setOpen: (open: boolean) => void
}) {
	const { pushSubscription } = usePush()
	const submit = useSubmit()

	return (
		<Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
			<DialogContent className="w-11/12">
				<Form
					method="post"
					action="/api/notifications/subscribe/news"
					onSubmit={(e) => {
						e.preventDefault()

						const formData = new FormData(e.currentTarget)
						if (pushSubscription) {
							formData.append("pushSubscription", JSON.stringify(pushSubscription))
						}

						submit(formData, {
							encType: "multipart/form-data",
							method: "post",
							action: "/api/notifications/subscribe/news",
							// replace: false,
							// relative: "route"
							navigate: false
						})

						setOpen(false)
					}}
				>
					<DialogHeader>
						<DialogTitle>Nouvelle notification</DialogTitle>
						<DialogDescription>Ajouter une notification pour une actualité</DialogDescription>
					</DialogHeader>

					{/* <div>
					<p>Notification</p>
				</div> */}

					<div>
						<Input type="text" name="name" placeholder="Nom de la notification" className="w-full" />

						<Input type="text" name="keywords" placeholder="Mots clés" className="w-full" />
					</div>

					{/* {loading ? <p>Chargement...</p> : null} */}

					<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
						<DialogClose asChild={true}>
							<Button variant="destructive" type="reset">
								Fermer
							</Button>
						</DialogClose>
						<Button variant="default" type="submit">
							Ajouter
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
