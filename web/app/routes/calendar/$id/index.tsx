import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
import {
	MdAdd,
	MdDelete,
	MdMoreVert,
	MdNotificationsActive,
	MdOpenInNew,
	MdOutlineNotificationAdd
} from "react-icons/md"
import { ScrollTop } from "@/components/scrollTop"
import { getEventById } from "@/utils/events"
import { cn } from "@/lib/utils"
import BackButton from "@/components/button/backButton"
import { Button } from "@/components/ui/button"
import { getUser } from "../../../session.server"
import DialogAccount from "@/components/dialog/dialogAccount"
import { useState } from "react"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog"
import type { Events } from "@/schema/events"
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { notificationEventSchema } from "@/schema/notifications"
import { and, eq } from "drizzle-orm"
import { usePush } from "@remix-pwa/push/client"
import DialogNotification from "@/components/dialog/dialogNotification"
import TimeCounter from "@/components/timeCounter"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "../../../components/ui/dropdown-menu"
import ShareButton from "../../../components/button/shareButton"
import CopyButton from "../../../components/button/copyButton"
import { toast as sonner } from "sonner"
import Loading from "../../../components/loading"
import i18next from "../../../i18next.server"
import { useTranslation } from "react-i18next"
import { countries } from "../../../i18n"
import type { TFunction } from "i18next"

export async function loader({ request, params }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "calendarId")
	const { id } = params

	// Redirect to the news page if the id is not provided
	if (!id) {
		return redirect("/calendar")
	}

	const { event } = await getEventById({ id })

	if (!event) {
		return redirect("/calendar")
	}

	const isPast = new Date(event.date) < new Date()

	const user = await getUser(request)

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	let hasNotification = false
	if (user) {
		const resultDb = await db
			.select()
			.from(notificationEventSchema)
			.where(and(eq(notificationEventSchema.userId, user.id), eq(notificationEventSchema.eventId, id)))

		hasNotification = resultDb.length > 0
	}

	// const { news, relatedSymbols } = await getNewsById({ id })

	// if (!news) return redirect("/news")

	const title = t("title")

	return {
		event: {
			...event,
			isPast
		},
		user,
		hasNotif: hasNotification,
		title
		// news,
		// relatedSymbols
	}
}

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
	if (!data) {
		return []
	}

	const { title } = data

	// TODO: Add description
	const description = ""

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			name: "canonical",
			content: `https://www.investor-helper.com/calendar/${params.id}`
		}
		// { name: "robots", content: "noindex" }
	]
}

export const handle = {
	i18n: "calendarId"
}

export default function Index() {
	const { t, i18n } = useTranslation("calendarId")
	const { isSubscribed } = usePush()
	const { user, event, hasNotif } = useLoaderData<typeof loader>()

	const [hasNotification, setHasNotification] = useState(hasNotif)

	const [showDialogAccount, setShowDialogAccount] = useState(false)
	const [showDialogNotification, setShowDialogNotification] = useState(false)
	const [showDialogNewNotification, setShowDialogNewNotification] = useState(false)
	const [showDialogDeleteNotification, setShowDialogDeleteNotification] = useState(false)

	const subscribeEvent = () => {
		if (event.isPast) {
			return
		}

		if (!user) {
			setShowDialogAccount(true)

			return
		}

		if (!isSubscribed) {
			setShowDialogNotification(true)

			return
		}

		if (hasNotification) {
			setShowDialogDeleteNotification(true)

			return
		}

		if (!hasNotification) {
			setShowDialogNewNotification(true)

			return
		}

		// fetch("/api/subscribe", {
		// 	method: "POST",
		// 	body: JSON.stringify({ event: event.id }),
		// 	headers: {
		// 		"Content-Type": "application/json"
		// 	}
		// })
	}

	return (
		<div className="relative flex w-full flex-col items-center overflow-hidden">
			<ScrollTop showBelow={250} />

			<DialogAccount
				open={showDialogAccount}
				setOpen={setShowDialogAccount}
				redirect={`/calendar/${event.id}`}
				callback={() => {
					setShowDialogAccount(false)

					subscribeEvent()
				}}
			/>

			<DialogNotification open={showDialogNotification} setOpen={setShowDialogNotification} />

			<DialogNewNotification
				event={event}
				open={showDialogNewNotification}
				setOpen={setShowDialogNewNotification}
				setHasNotification={setHasNotification}
			/>

			<DialogDeleteNotification
				event={event}
				open={showDialogDeleteNotification}
				setOpen={setShowDialogDeleteNotification}
				setHasNotification={setHasNotification}
			/>

			<div className="flex w-full flex-row items-center justify-evenly">
				<BackButton fallbackRedirect="/calendar" label={t("back")} />

				<div className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute">
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button variant="ghost">
								<MdMoreVert className="size-6" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mx-4">
							{event.isPast ? null : (
								<DropdownMenuItem asChild={true} className="p-0">
									<Button
										variant="ghost"
										onClick={subscribeEvent}
										className="p-6 pl-4 hover:cursor-pointer"
									>
										{isSubscribed && hasNotification ? (
											<p className="flex flex-row justify-start gap-1.5">
												{t("editNotification")}
												<MdNotificationsActive className="size-5" />
											</p>
										) : (
											<p className="flex flex-row justify-start gap-1.5">
												{t("addNotification")}
												<MdOutlineNotificationAdd className="size-5" />
											</p>
										)}
									</Button>
								</DropdownMenuItem>
							)}
							<DropdownMenuItem asChild={true} className="p-0">
								<CopyButton
									content={`https://www.investor-helper.com/calendar/${event.id}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
							<DropdownMenuItem asChild={true} className="p-0">
								<ShareButton
									title={event.title}
									text={event.comment ?? ""}
									url={`https://www.investor-helper.com/calendar/${event.id}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="w-full px-4 lg:w-1/2">
				<EventDetails event={event} t={t} language={i18n.language} />
			</div>
		</div>
	)
}

function EventDetails({ event, t, language }: {
	event: Events
	t: TFunction
	language: string
}) {

	const importance: Record<number, { name: string; color: string }> = {
		[-1]: {
			name: t("low"),
			color: "text-green-500"
		},
		0: {
			name: t("medium"),
			color: "text-orange-500"
		},
		1: {
			name: t("high"),
			color: "text-red-500"
		}
	}

	return (
		<div className="flex flex-col items-center justify-center pb-8">
			<div className="pb-8">
				<h1 className="pt-4 text-center font-bold text-2xl">{event.title}</h1>

				<h2 className={cn(importance[event.importance].color, "text-center text-xl")}>
					{t("importance")} {importance[event.importance].name}
				</h2>
				
			</div>

			<div className="flex w-full flex-col items-center gap-8">
				<div className="flex w-full flex-col items-center">
					<h2 className="font-bold text-xl">{t("description")}</h2>
					<p className="">{event?.comment ?? t("noDescription")}</p>
				</div>

				<div className="flex flex-col items-center">
					<h2 className="font-bold text-xl">{t("date")}</h2>

					<div className="flex flex-col items-center justify-center lg:flex-row lg:gap-1">
						<p>
							{new Date(event.date).toLocaleDateString(language, {
								weekday: "long",
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "numeric",
								minute: "numeric",
								second: "numeric"
							})}
						</p>
						<div className="flex flex-row items-center">
							<p>(</p>
							<TimeCounter date={event.date} separator={false} />
							<p>)</p>
						</div>
					</div>

					{event.period ? <p>{t("period")} : {event.period}</p> : null}
				</div>

				{event.forecast || event.previous || event.actual ? (
					<div className="flex flex-col items-center">
						<h2 className="font-bold text-xl">{t("numbers")}</h2>

						<div className="flex flex-col items-center">
							<p className="flex flex-row items-center gap-1">
								{t("previous")} :
								<DisplayNumber number={event.previous} unit={event.unit} scale={event.scale} t={t} />
							</p>
							<p className="flex flex-row items-center gap-1">
								{t("actual")} :
								<DisplayNumber number={event.actual} unit={event.unit} scale={event.scale} t={t} />
							</p>
							<p className="flex flex-row items-center gap-1">
								{t("forecast")} :
								<DisplayNumber number={event.forecast} unit={event.unit} scale={event.scale} t={t} />
							</p>
						</div>
					</div>
				) : null}

				<div className="flex flex-col items-center">
					<h2 className="font-bold text-xl">{t("other")}</h2>

					<div className="flex flex-col items-center gap-4">
						<div className="flex flex-col items-center">
							<p>{t("indicator")} : {event.indicator ?? t("noIndicator")}</p>
						</div>

						<div className="flex flex-col items-center">
							<p>{t("country")} : {countries[language][event.country]}</p>
							<p>{t("currency")} : {event.currency}</p>
						</div>

						<div className="flex flex-col items-center">
							{event.sourceUrl ? (
								<p className="flex flex-row flex-wrap items-center justify-center gap-1">
									{t("source")} :
									<Link
										to={event.sourceUrl}
										target="_blank"
										className="flex flex-row items-center justify-center gap-1 text-center underline"
									>
										{event.source && event.source !== "" ? event.source : event.sourceUrl}

										<MdOpenInNew className="inline-block" />
									</Link>
								</p>
							) : null}

							{!event.sourceUrl && event.source ? <p>{t("source")} : {event.source}</p> : null}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function DisplayNumber({ number, unit, scale, t }: { number: number | null; unit: string | null; scale: string | null, t: TFunction }) {
	if (number === null) {
		return <span>{t("noData")}</span>
	}

	return (
		<span>
			{number}
			{scale ? `${scale} ` : ""}
			{unit ? unit : ""}
		</span>
	)
}

function DialogNewNotification({
	event,
	open,
	setOpen,
	setHasNotification
}: {
	event: Events
	open: boolean
	setOpen: (open: boolean) => void
	setHasNotification: (hasNotification: boolean) => void
}) {
	const { pushSubscription } = usePush()
	const [loading, setLoading] = useState(false)

	const subscribe = () => {
		setLoading(true)

		const url = `/api/notifications/subscribe/calendar/${event.id}`

		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				remindThirtyMinutesBefore: true,
				remindOnTime: true,
				pushSubscription
			})
		})
			.then((rep) => {
				return rep.json()
			})
			.then(() => {
				setLoading(false)
				setOpen(false)
				setHasNotification(true)

				sonner.success("Notification ajoutée avec succès")
			})
			.catch((error) => {
				console.error("Error subscribing to notifications", error)

				setLoading(false)
				setOpen(false)

				sonner.error("Erreur lors de l'ajout de la notification")
			})
	}

	return (
		<Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
			<DialogContent className="w-11/12">
				<DialogHeader>
					<DialogTitle>Nouvelle notification</DialogTitle>
					<DialogDescription>
						Ajouter une notification pour l'événement {event.title} ({countries["fr-FR"][event.country]})
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
					<DialogClose asChild={true}>
						<Button variant="destructive" type="reset">
							Fermer
						</Button>
					</DialogClose>
					<Button
						variant="default"
						type="submit"
						onClick={subscribe}
						className={cn("flex flex-row items-center justify-center gap-1.5")}
						disabled={loading}
					>
						{loading ? <Loading className="size-5 border-2 text-black" /> : <MdAdd className="size-5" />}
						Ajouter
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function DialogDeleteNotification({
	event,
	open,
	setOpen,
	setHasNotification
}: {
	event: Events
	open: boolean
	setOpen: (open: boolean) => void
	setHasNotification: (hasNotification: boolean) => void
}) {
	const [loading, setLoading] = useState(false)

	const deleteNotification = () => {
		setLoading(true)

		const url = `/api/notifications/unsubscribe/calendar/${event.id}`

		fetch(url, {
			method: "POST"
		})
			.then((rep) => {
				return rep.json()
			})
			.then(() => {
				setLoading(false)
				setOpen(false)
				setHasNotification(false)

				sonner.success("Notification supprimée avec succès")
			})
			.catch((error) => {
				console.error("Error deleting notification", error)

				setLoading(false)
				setOpen(false)

				sonner.error("Erreur lors de la suppression de la notification")
			})
	}

	return (
		<Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
			<DialogContent className="w-11/12">
				<DialogHeader>
					<DialogTitle>Supprimer la notification</DialogTitle>
					<DialogDescription>Supprimer la notification pour l'événement {event.title}</DialogDescription>
				</DialogHeader>

				{/* {loading ? <p>Chargement...</p> : null} */}

				<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
					<DialogClose asChild={true}>
						<Button variant="destructive" type="reset">
							Fermer
						</Button>
					</DialogClose>
					{/* <Button variant="default" type="submit" onClick={deleteNotification}>
						Supprimer
					</Button> */}

					<Button
						variant="default"
						type="submit"
						onClick={deleteNotification}
						className={cn("flex flex-row items-center justify-center gap-1.5")}
						disabled={loading}
					>
						{loading ? <Loading className="size-5 border-2 text-black" /> : <MdDelete className="size-5" />}
						Supprimer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
