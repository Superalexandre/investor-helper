import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
import { MdNotificationsActive, MdOpenInNew, MdOutlineNotificationAdd } from "react-icons/md"
import { ScrollTop } from "@/components/scrollTop"
import { getEventById } from "@/utils/events"
import { cn } from "@/lib/utils"
import BackButton from "@/components/backButton"
import { Button } from "@/components/ui/button"
import { getUser } from "../../../session.server"
import DialogAccount from "@/components/dialogAccount"
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
import countries from "@/lang/countries-fr"
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { notificationEvent } from "@/schema/notifications"
import { and, eq } from "drizzle-orm"
import { usePush } from "@remix-pwa/push/client"
import DialogNotification from "@/components/dialogNotification"
import TimeCounter from "@/components/timeCounter"

export async function loader({ request, params }: LoaderFunctionArgs) {
	const { id } = params

	// Redirect to the news page if the id is not provided
	if (!id) {
		return redirect("/calendar")
	}

	const { event } = await getEventById({ id })

	if (!event) {
		return redirect("/calendar")
	}

	const user = await getUser(request)

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	let hasNotification = false
	if (user) {
		const resultDb = await db
			.select()
			.from(notificationEvent)
			.where(and(eq(notificationEvent.userId, user.id), eq(notificationEvent.eventId, id)))

		hasNotification = resultDb.length > 0
	}

	// const { news, relatedSymbols } = await getNewsById({ id })

	// if (!news) return redirect("/news")

	return {
		event,
		user,
		hasNotif: hasNotification
		// news,
		// relatedSymbols
	}
}

export const meta: MetaFunction<typeof loader> = ({ params }) => {
	const title = "Investor Helper - Calendrier"
	// const description = data?.news.news.title ?? ""
	const description = ""

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			name: "canonical",
			content: `https://investor-helper.com/calendar/${params.id}`
		},
		{ name: "robots", content: "noindex" }
	]
}

export default function Index() {
	const { isSubscribed } = usePush()
	const { user, event, hasNotif } = useLoaderData<typeof loader>()

	const [hasNotification, setHasNotification] = useState(hasNotif)

	const [showDialogAccount, setShowDialogAccount] = useState(false)
	const [showDialogNotification, setShowDialogNotification] = useState(false)
	const [showDialogNewNotification, setShowDialogNewNotification] = useState(false)
	const [showDialogDeleteNotification, setShowDialogDeleteNotification] = useState(false)

	const importance: Record<number, { name: string; color: string }> = {
		[-1]: {
			name: "faible",
			color: "text-green-500"
		},
		0: {
			name: "moyen",
			color: "text-orange-500"
		},
		1: {
			name: "élevé",
			color: "text-red-500"
		}
	}

	const subscribeEvent = () => {
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

			{/* <BackButton /> */}

			<div className="flex w-full flex-row items-center justify-evenly">
				<BackButton />

				<Button
					variant="ghost"
					className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
					onClick={subscribeEvent}
				>
					{hasNotification ? (
						<MdNotificationsActive className="size-6" />
					) : (
						<MdOutlineNotificationAdd className="size-6" />
					)}
				</Button>
			</div>

			<div className="w-full px-4 lg:w-1/2">
				<div className="flex flex-col items-center justify-center pb-8">
					<h1 className="pt-4 text-center font-bold text-2xl">{event.title}</h1>

					<h2 className={cn(importance[event.importance].color, "text-xl")}>
						Importance {importance[event.importance].name}
					</h2>
				</div>

				<div className="flex w-full flex-col items-center gap-8">
					<div className="flex w-full flex-col items-center">
						<h2 className="font-bold text-xl">Description</h2>
						<p className="">{event?.comment ?? "Aucune description"}</p>
					</div>

					<div className="flex flex-col items-center">
						<h2 className="font-bold text-xl">Date</h2>

						<div className="flex flex-col items-center justify-center lg:flex-row lg:gap-1">
							<p>
								{new Date(event.date).toLocaleDateString("fr", {
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
								<TimeCounter 
									date={event.date} 
									separator={false}
								/>
								<p>)</p>
							</div>
						</div>

						{event.period ? <p>Période : {event.period}</p> : null}
					</div>

					{event.forecast || event.previous || event.actual ? (
						<div className="flex flex-col items-center">
							<h2 className="font-bold text-xl">Chiffres</h2>

							<div className="flex flex-col items-center">
								<p className="flex flex-row items-center gap-1">
									Précédent :
									<DisplayNumber number={event.previous} unit={event.unit} scale={event.scale} />
								</p>
								<p className="flex flex-row items-center gap-1">
									Actuel :
									<DisplayNumber number={event.actual} unit={event.unit} scale={event.scale} />
								</p>
								<p className="flex flex-row items-center gap-1">
									Prévisions :
									<DisplayNumber number={event.forecast} unit={event.unit} scale={event.scale} />
								</p>
							</div>
						</div>
					) : null}

					<div className="flex flex-col items-center">
						<h2 className="font-bold text-xl">Autres informations</h2>

						<div className="flex flex-col items-center gap-4">
							<div className="flex flex-col items-center">
								<p>Indicateur : {event.indicator ?? "aucun indicateur"}</p>
							</div>

							<div className="flex flex-col items-center">
								<p>Pays : {countries[event.country]}</p>
								<p>Monnaie : {event.currency}</p>
							</div>

							<div className="flex flex-col items-center">
								{event.sourceUrl ? (
									<p className="flex flex-row items-center gap-1">
										Source :
										<Link to={event.sourceUrl} target="_blank" className="underline">
											{event.source} <MdOpenInNew className="inline-block" />
										</Link>
									</p>
								) : null}

								{!event.sourceUrl && event.source ? <p>Source : {event.source}</p> : null}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function DisplayNumber({ number, unit, scale }: { number: number | null; unit: string | null; scale: string | null }) {
	if (number === null) {
		return <span>aucune donnée</span>
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
			.then((data) => {
				console.log(data)

				setLoading(false)
				setOpen(false)
				setHasNotification(true)
			})
	}

	return (
		<Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
			<DialogContent className="w-11/12">
				<DialogHeader>
					<DialogTitle>Nouvelle notification</DialogTitle>
					<DialogDescription>
						Ajouter une notification pour l'événement {event.title} ({countries[event.country]})
					</DialogDescription>
				</DialogHeader>

				{/* <div>
					<p>Notification</p>
				</div> */}

				{loading ? <p>Chargement...</p> : null}

				<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
					<DialogClose asChild={true}>
						<Button variant="destructive" type="reset">
							Fermer
						</Button>
					</DialogClose>
					<Button variant="default" type="submit" onClick={subscribe}>
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
			.then((data) => {
				console.log(data)

				setLoading(false)
				setOpen(false)
				setHasNotification(false)
			})
	}

	return (
		<Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
			<DialogContent className="w-11/12">
				<DialogHeader>
					<DialogTitle>Supprimer la notification</DialogTitle>
					<DialogDescription>Supprimer la notification pour l'événement {event.title}</DialogDescription>
				</DialogHeader>

				{loading ? <p>Chargement...</p> : null}

				<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
					<DialogClose asChild={true}>
						<Button variant="destructive" type="reset">
							Fermer
						</Button>
					</DialogClose>
					<Button variant="default" type="submit" onClick={deleteNotification}>
						Supprimer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
