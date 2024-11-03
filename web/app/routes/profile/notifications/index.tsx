import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useFetcher, useLoaderData, useSubmit } from "@remix-run/react"
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
import { useRef, useState } from "react"
import { Input } from "../../../components/ui/input"
import DialogNotification from "../../../components/dialogNotification"
import { Badge } from "../../../components/ui/badge"
import Loading from "../../../components/loading"

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

	const fetcher = useFetcher()
	const fetchState = fetcher.state
	const fetchId = fetcher.formAction?.split("/").pop()

	const { isSubscribed } = usePush()

	const [notificationOpen, setNotificationOpen] = useState(false)
	const [notificationNewsOpen, setNotificationNewsOpen] = useState(false)
	const [notificationUpdateOpen, setNotificationUpdateOpen] = useState<string | null>(null)

	return (
		<div className="relative flex w-full flex-col items-center overflow-hidden">
			<BackButton safeRedirect="/profile" />

			<DialogNotification open={notificationOpen} setOpen={setNotificationOpen} />
			<DialogNotificationNews open={notificationNewsOpen} setOpen={setNotificationNewsOpen} type="create" />

			<div className="mt-4 flex w-full flex-col items-center justify-center gap-10">
				<div className="flex flex-col items-center justify-center gap-4">
					<h1 className="font-bold text-2xl">Notification actualités</h1>

					{/* News */}
					<div className="flex flex-col items-center justify-center gap-8">
						{fullSubscribedNews.length > 0 ? (
							fullSubscribedNews.map((notification) => (
								<div
									key={notification.notificationId}
									className="flex flex-col items-center justify-center gap-2"
								>
									<DialogNotificationNews
										open={notification.notificationId === notificationUpdateOpen}
										setOpen={(open) =>
											setNotificationUpdateOpen(open ? notification.notificationId : null)
										}
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
											<MdAdd />
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

				{/* Calendar */}
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
			</div>
		</div>
	)
}

function DeleteNewsNotification({ notificationId }: { notificationId: string }) {
	const fetcher = useFetcher()
	const fetchState = fetcher.state
	const fetchId = fetcher.formAction?.split("/").pop()

	return (
		<fetcher.Form method="post" action={`/api/notifications/unsubscribe/news/${notificationId}`}>
			<Button
				type="submit"
				variant="destructive"
				className="flex flex-row items-center justify-center gap-2"
				disabled={fetchId === notificationId && (fetchState === "loading" || fetchState === "submitting")}
			>
				Supprimer
				{fetchId === notificationId && (fetchState === "loading" || fetchState === "submitting") ? (
					<Loading className="size-4 border-2" />
				) : (
					<MdDelete className="size-4" />
				)}
			</Button>
		</fetcher.Form>
	)
}

function DialogNotificationNews({
	open,
	setOpen,
	type,
	keywords,
	groupName,
	id
}: {
	open: boolean
	setOpen: (open: boolean) => void
	type: "create" | "update"
	keywords?: string[]
	groupName?: string
	id?: string
}) {
	const { pushSubscription } = usePush()
	const submit = useSubmit()
	const fetcher = useFetcher()
	const [keyword, setKeyword] = useState<string[]>(keywords ?? [])
	const keywordInput = useRef<HTMLInputElement>(null)

	const action = type === "create" ? "/api/notifications/subscribe/news" : `/api/notifications/update/news/${id}`

	const addKeyword = () => {
		if (!keywordInput.current?.value) {
			return
		}

		const word = keywordInput.current.value.toLowerCase()

		if (keyword.includes(word) || word === "" || word === " " || word === ",") {
			return
		}

		setKeyword([...keyword, word])

		if (keywordInput.current) {
			keywordInput.current.value = ""
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(openChange) => {
				setOpen(openChange)
				setKeyword(keywords ?? [])
			}}
		>
			<DialogContent className="w-11/12">
				<fetcher.Form
					method="post"
					action={action}
					onSubmit={(e) => {
						e.preventDefault()

						if (keyword.length === 0) {
							return
						}

						const formData = new FormData(e.currentTarget)
						if (pushSubscription) {
							formData.append("pushSubscription", JSON.stringify(pushSubscription))
						}

						if (keyword.length > 0) {
							formData.append("keywords", keyword.join(","))
						}

						submit(formData, {
							encType: "multipart/form-data",
							method: "post",
							action: action,
							navigate: false
						})

						setOpen(false)
						setKeyword(keyword ?? keywords ?? [])
					}}
				>
					<DialogHeader>
						{type === "create" ? (
							<>
								<DialogTitle>Nouvelle notification</DialogTitle>
								<DialogDescription>Ajouter une notification pour une actualité</DialogDescription>
							</>
						) : (
							<>
								<DialogTitle>Modifier la notification</DialogTitle>
								<DialogDescription>Modifier une notification pour une actualité</DialogDescription>
							</>
						)}
					</DialogHeader>

					<div className="my-4 flex flex-col justify-start gap-4">
						<Input
							type="text"
							name="name"
							placeholder="Nom du groupe de notifications"
							className="w-full"
							required={true}
							defaultValue={groupName}
						/>

						<div className="flex flex-col gap-2">
							<div className="flex flex-row flex-wrap items-center gap-2">
								{keyword.map((word, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<Badge key={index} className="flex flex-row items-center gap-2">
										{word}

										<MdDelete
											size={16}
											className="hover:cursor-pointer"
											onClick={() => setKeyword(keyword.filter((_, i) => i !== index))}
										/>
									</Badge>
								))}
							</div>

							<div className="flex w-full flex-row gap-2">
								<Input
									type="text"
									placeholder="Mots clés"
									className="w-full"
									ref={keywordInput}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault()

											addKeyword()
										}
									}}
								/>

								<Button variant="outline" onClick={addKeyword} type="button">
									<MdAdd />
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
						<DialogClose asChild={true}>
							<Button
								variant="destructive"
								type="reset"
								onClick={() => {
									setKeyword(keywords ?? [])
								}}
							>
								Fermer
							</Button>
						</DialogClose>
						<Button variant="default" type="submit">
							{type === "create" ? "Créer" : "Modifier"}
						</Button>
					</DialogFooter>
				</fetcher.Form>
			</DialogContent>
		</Dialog>
	)
}
