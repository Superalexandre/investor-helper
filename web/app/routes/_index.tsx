import type { MetaFunction } from "@remix-run/node"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { usePWAManager } from "@remix-pwa/client"
import { MdDownload } from "react-icons/md"
import { getLastImportantNews } from "@/utils/news"
import { Link, useLoaderData, useNavigate } from "@remix-run/react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useEffect, useState } from "react"
import { getNextImportantEvent } from "../../utils/events"
import countries from "../../../lang/countries-fr"

export const meta: MetaFunction = () => {
	const title = "Investor Helper"
	const description = "Bienvenue sur Investor Helper"

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://investor-helper.com" }
	]
}

export async function loader() {
	// Get the last important news from the last 24 hours
	const from = new Date()
	from.setDate(from.getDate() - 1)

	const to = new Date()

	const news = await getLastImportantNews(from, to, 150, 10)
	const events = await getNextImportantEvent(from, to, 0, 10)

	return {
		publicKey: process.env.NOTIFICATION_PUBLIC_KEY,
		lastNews: news,
		nextEvents: events
	}
}

export default function Index() {
	const { lastNews, nextEvents } = useLoaderData<typeof loader>()

	const navigate = useNavigate()

	const { promptInstall } = usePWAManager()
	// const { subscribeToPush, unsubscribeFromPush, isSubscribed, pushSubscription } = usePush()
	// const [notificationError, setNotificationError] = useState<string | null>(null)

	const [isInstalled, setIsInstalled] = useState(true)

	const importance: Record<number, string> = {
		[-1]: "faible",
		0: "moyenne",
		1: "élevée"
	}

	useEffect(() => {
		const isTwa = document.referrer.startsWith("android-app://")
		const isStandalone = window.matchMedia("(display-mode: standalone)").matches
		const isMinimalUi = window.matchMedia("(display-mode: minimal-ui)").matches
		const isFullscreen = window.matchMedia("(display-mode: fullscreen)").matches
		const isWindowControlsOverlay = window.matchMedia("(display-mode: window-controls-overlay)").matches

		if (isTwa || isStandalone || isMinimalUi || isFullscreen || isWindowControlsOverlay) {
			setIsInstalled(true)
		} else {
			setIsInstalled(false)
		}
	}, [])

	return (
		<div className="flex flex-col items-center justify-center gap-8">
			<div className="mt-4 flex flex-col items-center justify-center">
				<img
					src="/logo-1024-1024.webp"
					loading="eager"
					alt="Investor Helper"
					className="mx-auto size-32"
					height="128"
					width="128"
					onDoubleClick={() => {
						navigate("/testing")
					}}
				/>

				<h1 className="font-bold text-xl">
					Bienvenue sur <span>Investor Helper</span>
				</h1>
			</div>

			{isInstalled ? null : (
				<div className="flex flex-col items-center justify-start gap-2">
					<Label className="text-bold text-xl">Installer l'application</Label>
					<Button
						onClick={() => {
							promptInstall(() => {
								console.log("Installation réussie")
							})
						}}
						className="flex items-center justify-center gap-2"
					>
						Installer
						<MdDownload />
					</Button>
				</div>
			)}

			<div className="flex max-w-full flex-col items-center gap-2 p-4">
				<h2 className="font-bold text-lg">Dernières actualités importantes</h2>

				<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
					{lastNews.length > 0 ? (
						lastNews.map((news) => (
							<Link to={`/news/${news.news.id}`} key={news.news.id}>
								<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal">
									<CardTitle className="p-4 text-center">{news.news.title}</CardTitle>
									<CardContent className="flex flex-col gap-4 p-4">
										<p className="h-24 max-h-24 overflow-clip">
											{news.news_article.shortDescription}
										</p>

										<div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
											<p>Par {news.news.source}</p>
											<DisplayDate date={news.news.published} />
										</div>
									</CardContent>
								</Card>
							</Link>
						))
					) : (
						<p>Aucune actualité importante</p>
					)}
				</div>

				<Link to="/news">
					<Button variant="default">Voir plus</Button>
				</Link>
			</div>

			<div className="flex max-w-full flex-col items-center gap-2 p-4">
				<h2 className="font-bold text-lg">Prochains événements importantes</h2>

				<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
					{nextEvents.length > 0 ? (
						nextEvents.map((event) => (
							<Link to={`/calendar/${event.id}`} key={event.id}>
								<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal">
									<CardTitle className="p-4 text-center">{event.title}</CardTitle>
									<CardContent className="flex flex-col gap-4 p-4">
										<p className="h-24 max-h-24 overflow-clip">{event.comment}</p>

										<div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
											<p>Importance : {importance[event.importance]}</p>
											<p>Pays : {countries[event.country]}</p>
											<div className="flex flex-row items-center gap-1">
												<p>Dans</p>
												<p>
													{formatDistanceToNow(new Date(event.date), {
														locale: fr
													})}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))
					) : (
						<p>Aucun événement important</p>
					)}
				</div>

				<Link to="/calendar">
					<Button variant="default">Voir plus</Button>
				</Link>
			</div>
		</div>
	)
}

function DisplayDate({ date }: { date: number }) {
	const d = new Date(date * 1000)

	// Use date-fns
	const formattedDate = formatDistanceToNow(d, {
		locale: fr
	})

	return <p>Il y a {formattedDate}</p>
}
