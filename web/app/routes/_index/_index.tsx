import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { usePWAManager } from "@remix-pwa/client"
import { Link, useLoaderData, useNavigate } from "@remix-run/react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { differenceInSeconds, formatDistanceToNow } from "date-fns"
import { useEffect, useState, memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "../../components/ui/skeleton"
import type { Events } from "../../../../db/schema/events"
import type { NewsArticle } from "../../../types/News"
import { useTranslation } from "react-i18next"
import { countries, dateFns } from "../../i18n"
import type { TFunction } from "i18next"
import i18next from "../../i18next.server"
import SymbolLogo from "../../components/symbolLogo"
import type { BestGainer } from "../../../types/Prices"
import getHomePreferences from "../../lib/getHomePreferences"
import { SmallChart } from "../../components/charts/smallChart"
import { cn } from "../../lib/utils"
import { Badge } from "../../components/ui/badge"
import { format, toDate, fromZonedTime, } from "date-fns-tz"
import type { MarketStatus } from "../../../types/Hours"
import { CalendarDaysIcon, ChartSplineIcon, ClockIcon, DownloadIcon, NewspaperIcon } from "lucide-react"
import { TriangleDownIcon, TriangleUpIcon } from "@radix-ui/react-icons"
import { Footer } from "../../components/footer"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return []
	}

	const { title, description } = data

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://www.investor-helper.com" }
	]
}

export async function loader({ request }: LoaderFunctionArgs) {
	const [t, homePreferences] = await Promise.all([i18next.getFixedT(request, "home"), getHomePreferences(request)])

	const title = t("title")
	const description = t("description")

	return {
		title: title,
		description: description,
		publicKey: process.env.NOTIFICATION_PUBLIC_KEY,
		homePreferences: homePreferences
	}
}

export const handle = {
	i18n: "home"
}

export default function Index() {
	const { homePreferences } = useLoaderData<typeof loader>()
	const { t, i18n } = useTranslation("home")
	const navigate = useNavigate()

	const { promptInstall } = usePWAManager()

	const [isInstalled, setIsInstalled] = useState(true)

	const memoizedDownloadIcon = useMemo(() => <DownloadIcon />, [])

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

	const menus = [
		{
			name: "marketHours",
			component: () => (
				<>
					<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
						<ClockIcon />

						{t("marketHours")}
					</h2>

					<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex w-full max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2 ">
						<DisplayHours t={t} language={i18n.language} />
					</div>
				</>
			)
		},
		{
			name: "bestLosers",
			component: () => (
				<>
					<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
						<ChartSplineIcon />

						{t("bestLosers")}
					</h2>

					<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
						<DisplayBestLosers t={t} />
					</div>
				</>
			)
		},
		{
			name: "bestGainers",
			component: () => (
				<>
					<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
						<ChartSplineIcon />

						{t("bestGainers")}
					</h2>

					<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
						<DisplayBestGainers t={t} />
					</div>
				</>
			)
		},
		{
			name: "news",
			component: () => (
				<>
					<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
						<NewspaperIcon />

						{t("lastNews")}
					</h2>

					<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
						<DisplayLastNews t={t} language={i18n.language} />
					</div>

					<Link to="/news">
						<Button variant="default">{t("seeMore")}</Button>
					</Link>
				</>
			)
		},
		{
			name: "events",
			component: () => (
				<>
					<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
						<CalendarDaysIcon />

						{t("nextEvents")}
					</h2>

					<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
						<DisplayNextEvents t={t} language={i18n.language} />
					</div>

					<Link to="/calendar">
						<Button variant="default">{t("seeMore")}</Button>
					</Link>
				</>
			)
		}
	]



	// console.log(homePreferences)

	const sortedPreferences = homePreferences.filter((pref) => pref.visible).sort((a, b) => a.position - b.position)
	const displayedMenu = sortedPreferences
		.map((pref) => menus.find((menu) => menu.name === pref.id))
		.filter((menu) => menu !== undefined)

	return (
		<div>

			<div className="flex flex-col items-center justify-center gap-8">
				<div className="mt-4 flex flex-col items-center justify-center">
					<img
						src="/logo-128-128.webp"
						loading="eager"
						alt="Investor Helper"
						className="mx-auto size-32"
						height="128"
						width="128"
						onDoubleClick={() => {
							navigate("/testing")
						}}
					/>

					<h1 className="font-bold text-xl">{t("welcome")}</h1>
				</div>

				{isInstalled ? null : (
					<div className="flex flex-col items-center justify-start gap-2">
						<Label className="text-bold text-xl">{t("downloadApp")}</Label>
						<Button
							type="button"
							onClick={() => promptInstall()}
							className="flex items-center justify-center gap-2"
						>
							{t("download")}
							{memoizedDownloadIcon}
						</Button>
					</div>
				)}

				{displayedMenu.map((menu) => (
					<div className="flex max-w-full flex-col items-center gap-2 p-4 w-full" key={menu.name}>
						{menu.component()}
					</div>
				))}
			</div>
			
			{/* <Footer /> */}
		</div>
	)
}

const DisplayDate = memo(function DisplayDate({ date, locale }: { date: number; locale: string }) {
	const d = new Date(date * 1000)

	const formattedDate = formatDistanceToNow(d, {
		locale: dateFns[locale],
		addSuffix: true
	})

	return <p>{formattedDate}</p>
})

const DisplayBestLosers = memo(function DisplayBestLosers({
	t
}: {
	t: TFunction
}) {
	const {
		data: losers,
		isPending,
		error
	} = useQuery<{
		result: BestGainer[]
	}>({
		queryKey: ["bestLosers"],
		queryFn: async () => {
			const req = await fetch("/api/prices/bestLosers")
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	type RecommendationArray = Array<{
		min: number
		max: number
		recommendation: string
		color: string
	}>
	const recommendationMap: RecommendationArray = [
		{
			min: 0,
			max: 1,
			recommendation: t("recommendations.strongBuy"),
			color: "text-green-600"
		}, {
			min: 1,
			max: 2,
			recommendation: t("recommendations.buy"),
			color: "text-green-500"
		}, {
			min: 2,
			max: 3,
			recommendation: t("recommendations.hold"),
			color: "text-gray-500"
		}, {
			min: 3,
			max: 4,
			recommendation: t("recommendations.sell"),
			color: "text-red-500"
		}, {
			min: 4,
			max: 5,
			recommendation: t("recommendations.strongSell"),
			color: "text-red-600"
		}
	]
	const recommendation = (value: number): string => {
		const rec = recommendationMap.find((rec) => value >= rec.min && value < rec.max)
		return rec ? rec.recommendation : "Unknown"
	}

	const recommendationColor = (value: number): string => {
		const rec = recommendationMap.find((rec) => value >= rec.min && value < rec.max)
		return rec ? rec.color : "text-gray-500"
	}

	if (error) {
		return <p>{t("errors.loading")}</p>
	}

	if (isPending) {
		return new Array(10).fill(null).map((_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={index}>
				<CardTitle className="p-4 text-center">
					<Skeleton className="h-6 w-1/2" />
				</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<Skeleton className="h-24 w-full" />

					<div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 p-4 text-muted-foreground">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</CardContent>
			</Card>
		))
	}

	if (!losers || losers.result.length <= 0) {
		return <p>{t("errors.emptyGainers")}</p>
	}

	return losers.result.map((loser) => (
		<Link to={`/data/${loser.symbol}`} key={loser.name}>
			<Card className="relative size-80 whitespace-normal border-card-border">
				<CardTitle className="flex flex-row items-center justify-center gap-2 p-4 text-center">
					<SymbolLogo symbol={loser} className="size-6 rounded-full" alt={loser.description} />

					{loser.description}
				</CardTitle>
				<CardContent className="flex flex-col items-center justify-center gap-4 p-4">
					<div className="flex flex-col items-center justify-center">
						<div className="flex flex-row items-center gap-2">
							<p>
								{loser.close}
								{loser.currency}
							</p>
							<Badge className="flex flex-row items-center bg-red-500 font-bold text-white hover:bg-red-500">
								<TriangleDownIcon className="size-5" />
								<span>{Number(loser.rawChange).toFixed(2)}%</span>
							</Badge>
						</div>
						{loser.recommendation_mark ?
							<p className={cn(recommendationColor(loser.recommendation_mark))}>{recommendation(loser.recommendation_mark)}</p>
							: null}
					</div>

					<SmallChart prices={loser.prices} />
				</CardContent>
			</Card>
		</Link>
	))
})

const DisplayBestGainers = memo(function DisplayBestGainers({
	t
}: {
	t: TFunction
}) {
	const {
		data: gainers,
		isPending,
		error
	} = useQuery<{
		result: BestGainer[]
	}>({
		queryKey: ["bestGainers"],
		queryFn: async () => {
			const req = await fetch("/api/prices/bestGainers")
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	type RecommendationArray = Array<{
		min: number
		max: number
		recommendation: string
		color: string
	}>
	const recommendationMap: RecommendationArray = [
		{
			min: 0,
			max: 1,
			recommendation: t("recommendations.strongBuy"),
			color: "text-green-600"
		}, {
			min: 1,
			max: 2,
			recommendation: t("recommendations.buy"),
			color: "text-green-500"
		}, {
			min: 2,
			max: 3,
			recommendation: t("recommendations.hold"),
			color: "text-gray-500"
		}, {
			min: 3,
			max: 4,
			recommendation: t("recommendations.sell"),
			color: "text-red-500"
		}, {
			min: 4,
			max: 5,
			recommendation: t("recommendations.strongSell"),
			color: "text-red-600"
		}
	]

	const recommendation = (value: number): string => {
		const rec = recommendationMap.find((rec) => value >= rec.min && value < rec.max)
		return rec ? rec.recommendation : "Unknown"
	}

	const recommendationColor = (value: number): string => {
		const rec = recommendationMap.find((rec) => value >= rec.min && value < rec.max)
		return rec ? rec.color : "text-gray-500"
	}

	if (error) {
		return <p>{t("errors.loading")}</p>
	}

	if (isPending) {
		return new Array(10).fill(null).map((_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={index}>
				<CardTitle className="p-4 text-center">
					<Skeleton className="h-6 w-1/2" />
				</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<Skeleton className="h-24 w-full" />

					<div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 p-4 text-muted-foreground">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</CardContent>
			</Card>
		))
	}

	if (!gainers || gainers.result.length <= 0) {
		return <p>{t("errors.emptyGainers")}</p>
	}

	return gainers.result.map((gainer) => (
		<Link to={`/data/${gainer.symbol}`} key={gainer.name}>
			<Card className="relative size-80 whitespace-normal border-card-border">
				<CardTitle className="flex flex-row items-center justify-center gap-2 p-4 text-center">
					<SymbolLogo symbol={gainer} className="size-6 rounded-full" alt={gainer.description} />

					{gainer.description}
				</CardTitle>
				<CardContent className="flex flex-col items-center justify-center gap-4 p-4">
					<div className="flex flex-col items-center justify-center">

						<div className="flex flex-row items-center gap-2">
							<p>
								{gainer.close}
								{gainer.currency}
							</p>
							<Badge className="flex flex-row items-center justify-center bg-green-500 font-bold text-white hover:bg-green-500">
								<TriangleUpIcon className="size-5" />
								<span>{Number(gainer.rawChange).toFixed(2)}%</span>
							</Badge>
						</div>
						{gainer.recommendation_mark ?
							<p className={cn(recommendationColor(gainer.recommendation_mark))}>{recommendation(gainer.recommendation_mark)}</p>
							: null}
					</div>

					<SmallChart prices={gainer.prices} />
				</CardContent>
			</Card>
		</Link>
	))
})

const DisplayLastNews = memo(function DisplayLastNews({
	t,
	language
}: {
	t: TFunction
	language: string
}) {
	const {
		data: lastNews,
		isPending,
		error
	} = useQuery<NewsArticle[]>({
		queryKey: ["importantNews"],
		queryFn: async () => {
			const req = await fetch("/api/news/important")
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	if (error) {
		return <p>{t("errors.loading")}</p>
	}

	if (isPending) {
		return new Array(10).fill(null).map((_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={index}>
				<CardTitle className="p-4 text-center">
					<Skeleton className="h-6 w-1/2" />
				</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<Skeleton className="h-24 w-full" />

					<div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 p-4 text-muted-foreground">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</CardContent>
			</Card>
		))
	}

	if (!lastNews || lastNews?.length <= 0) {
		return <p>{t("errors.emptyNews")}</p>
	}

	return lastNews.map((news) => (
		<Link to={`/news/${news.news.id}`} key={news.news.id}>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border">
				<CardTitle className="p-4 text-center">{news.news.title}</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<p className="h-24 max-h-24 overflow-clip">{news.news_article.shortDescription}</p>

					<div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
						<p>
							{t("by")} {news.news.source}
						</p>
						<DisplayDate date={news.news.published} locale={language} />
					</div>
				</CardContent>
			</Card>
		</Link>
	))
})

const DisplayNextEvents = memo(function DisplayNextEvents({
	t,
	language
}: {
	t: TFunction
	language: string
}) {
	const importance: Record<number, string> = {
		[-1]: t("low"),
		0: t("medium"),
		1: t("high")
	}

	const {
		data: nextEvents,
		isPending,
		error
	} = useQuery<Events[]>({
		queryKey: ["importantEvents"],
		queryFn: async () => {
			const req = await fetch("/api/calendar/important")
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	if (error) {
		return <p>{t("errors.emptyEvents")}</p>
	}

	if (isPending) {
		return new Array(10).fill(null).map((_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={index}>
				<CardTitle className="p-4 text-center">
					<Skeleton className="h-6 w-1/2" />
				</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<Skeleton className="h-24 w-full" />

					<div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 p-4 text-muted-foreground">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</CardContent>
			</Card>
		))
	}

	if (!nextEvents || nextEvents.length <= 0) {
		return <p>{t("errors.emptyEvents")}</p>
	}

	return nextEvents.map((event) => (
		<Link to={`/calendar/${event.id}`} key={event.id}>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border">
				<CardTitle className="p-4 text-center">{event.title}</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<p className="h-24 max-h-24 overflow-clip">{event.comment}</p>

					<div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
						<p>
							{t("importance")} : {importance[event.importance]}
						</p>
						<p>
							{t("country")} : {countries[language][event.country]}
						</p>
						<div className="flex flex-row items-center gap-1">
							<p>
								{formatDistanceToNow(new Date(event.date), {
									locale: dateFns[language],
									addSuffix: true
								})}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	))
})


const DisplayHours = memo(function DisplayHours({
	t,
	language
}: {
	t: TFunction
	language: string
}) {
	const [actualDate, setActualDate] = useState(new Date())

	const {
		data: hours,
		isPending,
		error
	} = useQuery<MarketStatus[]>({
		queryKey: ["hours"],
		queryFn: async () => {
			const req = await fetch("/api/hours")
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	useEffect(() => {
		const interval = setInterval(() => {
			setActualDate(new Date())
		}, 1000)

		return () => clearInterval(interval)
	}, [])

	if (error) {
		return <p>{t("errors.loading")}</p>
	}

	if (isPending) {
		return new Array(10).fill(null).map((_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={index}>
				<CardTitle className="p-4 text-center">
					<Skeleton className="h-6 w-1/2" />
				</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<Skeleton className="h-24 w-full" />

					<div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 p-4 text-muted-foreground">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</CardContent>
			</Card>
		))
	}

	if (!hours || hours?.length <= 0) {
		return <p>{t("errors.emptyHours")}</p>
	}

	const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

	const formatDistance = (marketDate: Date, marketTimezone: string): string => {
		const marketDateTimezone = fromZonedTime(marketDate, marketTimezone)
		marketDateTimezone.setSeconds(0) // Avoiding seconds to avoid flickering

		// Convertir la date en date locale
		const marketDateLocal = toDate(marketDateTimezone)

		// Calculer la différence en secondes
		const diff = differenceInSeconds(marketDateLocal, actualDate)

		const diffInHours = diff / 3600
		const diffInMinutes = diff / 60
		const diffInSeconds = diff

		// Formater la différence
		let formatted = ""

		if (diffInHours > 0) {
			formatted += `${Math.floor(diffInHours)}h `
		}

		if (diffInMinutes > 0) {
			formatted += `${Math.floor(diffInMinutes % 60)}m `
		}

		if (diffInSeconds > 0) {
			formatted += `${Math.floor(diffInSeconds % 60)}s`
		}

		return formatted
	}

	const getOpeningTimeInUserLocal = (
		marketDate: Date,
		marketTimezone: string
	): string => {
		const marketDateTimezone = fromZonedTime(marketDate, marketTimezone)

		// Formater la date
		return format(marketDateTimezone, "HH:mm", {
			timeZone: userTimezone
		});
	};

	const formatDecimalTime = (decimalTime: number): string => {
		// Séparer les parties entière et décimale
		const hours = Math.floor(decimalTime);
		const minutes = Math.round((decimalTime % 1) * 60);

		// Formater avec deux chiffres pour les heures et minutes
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
	}

	// return (
	// 	<Card className="border-card-border w-full">
	// 		<CardContent className="w-full flex flex-col items-center gap-4">
	// 			{hours.map((hour) => (
	// 				<div className="flex flex-row items-center gap-2" key={hour.marketId}>
	// 					{hour.hasLogo ? (
	// 						<img
	// 							src={`/logo/${hour.marketId}.png`}
	// 							alt={hour.marketName}
	// 							className="rounded-full size-6"
	// 							loading="lazy"
	// 							width="48"
	// 							height="48"
	// 						/>
	// 					) : null}

	// 					{hour.marketName}

	// 					{hour.open ? <OpenIndicator /> : <CloseIndicator />}

	// 					<p>
	// 						{hour.open ? "Ouvert" : `Fermé ${hour.closeReason !== "close" ? hour.closeReason : ""}`}
	// 					</p>


	// 					{hour.open ? (
	// 						<div className="flex flex-col">
	// 							<p>
	// 								Fermeture à {getOpeningTimeInUserLocal(hour.nextCloseDate, hour.timezone)} ({formatDecimalTime(hour.closeHour)}h heure locale)
	// 							</p>
	// 							<p>
	// 								Dans {formatDistance(hour.nextCloseDate, hour.timezone)}
	// 							</p>
	// 						</div>
	// 					) : (
	// 						<div className="flex flex-col">
	// 							<p>
	// 								Ouverture à {getOpeningTimeInUserLocal(hour.nextOpenDate, hour.timezone)} ({formatDecimalTime(hour.openHour)}h heure locale)
	// 							</p>
	// 							<p>
	// 								Dans {formatDistance(hour.nextOpenDate, hour.timezone)}
	// 							</p>
	// 						</div>
	// 					)}
	// 				</div>
	// 			))}
	// 		</CardContent>
	// 	</Card>
	// )

	return hours.map((hour) => (
		<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={hour.marketId}>
			<CardTitle className="flex flex-row items-center justify-center gap-2 p-4 text-center">
				{hour.hasLogo ? (
					<img
						src={`/logo/${hour.marketId}.png`}
						alt={hour.marketName}
						className="rounded-full size-6"
						loading="lazy"
						width="48"
						height="48"
					/>
				) : null}

				{hour.marketName}
			</CardTitle>
			<CardContent className="flex flex-col gap-4 p-4">
				<div className="flex flex-row items-center justify-center gap-2">

					{hour.open ? <OpenIndicator /> : <CloseIndicator />}

					<p>
						{hour.open ? t("open") : `${t("closed")} ${hour.closeReason !== "close" ? hour.closeReason : ""}`}
					</p>
				</div>

				{hour.open ? (
					<div className="flex flex-col">
						<p>
							{t("closingAt")} {getOpeningTimeInUserLocal(hour.nextCloseDate, hour.timezone)} ({formatDecimalTime(hour.closeHour)}{t("hourIndicator")} {t("localTime")})
						</p>
						<p>
							{t("in")} {formatDistance(hour.nextCloseDate, hour.timezone)}
						</p>
					</div>
				) : (
					<div className="flex flex-col">
						<p>
							{t("openingAt")} {getOpeningTimeInUserLocal(hour.nextOpenDate, hour.timezone)} ({formatDecimalTime(hour.openHour)}{t("hourIndicator")} {t("localTime")})
						</p>
						<p>
							{t("in")} {formatDistance(hour.nextOpenDate, hour.timezone)}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	))
})

const OpenIndicator = memo(function OpenIndicator() {
	return (
		<div className="relative">
			<div className="size-2 rounded-full bg-green-500" />
			<div className="absolute top-0 size-2 animate-ping rounded-full bg-green-600 duration-1000" />
		</div>
	)
})

const CloseIndicator = memo(function CloseIndicator() {
	return (
		<div className="relative">
			<div className="size-2 rounded-full bg-red-500" />
			<div className="absolute top-0 size-2 animate-ping rounded-full bg-red-600 duration-1000" />
		</div>
	)
})