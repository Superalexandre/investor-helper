import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useFetcher, useLoaderData } from "@remix-run/react"
import { getUser } from "@/session.server"
import BackButton from "../../../components/button/backButton"
import { getUserNotifications } from "../../../../utils/notifications"
import { Button } from "../../../components/ui/button"
import { MdAdd, MdDelete, MdEdit } from "react-icons/md"
import { usePush } from "@remix-pwa/push/client"
import { type Dispatch, type SetStateAction, useState } from "react"
import DialogNotification from "../../../components/dialog/dialogNotification"
import Loading from "../../../components/loading"
import DialogNotificationNews from "../../../components/dialog/dialogNotificationNews"
import DeleteNewsNotification from "../../../components/dialog/dialogDeleteNews"
import type { NotificationSubscribedFullNews } from "../../../../types/Notifications"

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		return redirect("/login?redirect=/profile/notifications")
	}

	const { notifications, calendarNotifications, subscribedNews, fullSubscribedNews } =
		await getUserNotifications(user)

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
	const { calendarNotifications, fullSubscribedNews } = useLoaderData<typeof loader>()

	const [notificationOpen, setNotificationOpen] = useState(false)
	const [notificationNewsOpen, setNotificationNewsOpen] = useState(false)

	return (
		<div className="relative flex w-full flex-col items-center overflow-hidden">
			<BackButton />

			<DialogNotification open={notificationOpen} setOpen={setNotificationOpen} />
			<DialogNotificationNews open={notificationNewsOpen} setOpen={setNotificationNewsOpen} type="create" />

			<div className="mt-4 flex w-full flex-col items-center justify-center gap-10">
				<NewsNotifications
					news={fullSubscribedNews}
					setNotificationNewsOpen={setNotificationNewsOpen}
					setNotificationOpen={setNotificationOpen}
				/>

				<CalendarNotifications
					calendarNotifications={calendarNotifications}
				/>
			</div>
		</div>
	)
}

function CalendarNotifications({
	calendarNotifications,
}: {
	calendarNotifications: { events: { id: string; title: string } }[]
}) {
	const fetcher = useFetcher()
	const fetchState = fetcher.state
	const fetchId = fetcher.formAction?.split("/").pop()

	return (
		<div className="flex flex-col items-center justify-center gap-4">
			<h1 className="font-bold text-2xl">Notification calendrier</h1>

			<div className="flex flex-col items-center justify-center gap-2">
				{calendarNotifications.length > 0 ? (
					calendarNotifications.map(({ events }) => (
						<div key={events.id} className="flex flex-row items-center justify-center gap-2">
							<Link
								to={`/calendar/${events.id}`}
								state={{
									redirect: "/profile/notifications"
								}}
							>
								{events.title}
							</Link>

							<fetcher.Form
								method="post"
								action={`/api/notifications/unsubscribe/calendar/${events.id}`}
							>
								<Button
									type="submit"
									variant="destructive"
									className="flex flex-row items-center justify-center gap-2"
									disabled={
										fetchId === events.id &&
										(fetchState === "loading" || fetchState === "submitting")
									}
								>
									Supprimer
									{fetchId === events.id &&
										(fetchState === "loading" || fetchState === "submitting") ? (
										<Loading className="size-4 border-2" />
									) : (
										<MdDelete className="size-4" />
									)}
								</Button>
							</fetcher.Form>
						</div>
					))
				) : (
					<p>Vous n'avez pas de notification de calendrier</p>
				)}
			</div>
		</div>
	)
}

function NewsNotifications({
	news,
	setNotificationNewsOpen,
	setNotificationOpen,

}: {
	news: NotificationSubscribedFullNews[],
	setNotificationNewsOpen: Dispatch<SetStateAction<boolean>>,
	setNotificationOpen: Dispatch<SetStateAction<boolean>>,
}) {
	const { isSubscribed } = usePush()
	const [notificationUpdateOpen, setNotificationUpdateOpen] = useState<string | null>(null)

	return (
		<div className="flex flex-col items-center justify-center gap-4">
			<h1 className="font-bold text-2xl">Notification actualités</h1>

			<div className="flex flex-col items-center justify-center gap-8">
				{news.length > 0 ? (
					news.map((notification) => (
						<div
							key={notification.notificationId}
							className="flex flex-col items-center justify-center gap-2"
						>
							<DialogNotificationNews
								open={notification.notificationId === notificationUpdateOpen}
								setOpen={(open) => {
									setNotificationUpdateOpen(open ? notification.notificationId : null)
								}}
								type="update"
								keywords={notification.keywords.map((word) => word.keyword)}
								groupName={notification.name}
								id={notification.notificationId}
							/>

							<h1 className="font-bold text-lg">{notification.name}</h1>
							<p>{notification.keywords.map((word) => word.keyword).join(", ")}</p>
							<p>{notification.symbols.map((symbol) => symbol.symbol).join(", ")}</p>

							<div className="flex flex-row gap-2">
								<DeleteNewsNotification notificationId={notification.notificationId} />

								<Button
									className="flex flex-row items-center justify-center gap-2"
									onClick={() => {
										setNotificationUpdateOpen(notification.notificationId)
									}}
								>
									Modifier

									<MdEdit />
								</Button>
							</div>
						</div>
					))
				) : (
					<p>Vous n'avez pas de notification pour les actualités</p>
				)}
			</div>

			<div className="flex flex-col items-center justify-center gap-2">
				<Button
					className="flex flex-row items-center justify-center gap-2"
					onClick={() => {
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
		</div>
	)
}