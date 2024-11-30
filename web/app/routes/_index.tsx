import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { usePWAManager } from "@remix-pwa/client"
import { MdCalendarToday, MdDownload, MdNewspaper, MdShowChart } from "react-icons/md"
import type { } from "@/utils/news"
import { Link, useLoaderData, useNavigate } from "@remix-run/react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState, memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "../components/ui/skeleton"
import type { Events } from "../../../db/schema/events"
import type { NewsArticle } from "../../types/News"
import { useTranslation } from "react-i18next"
import { countries, dateFns } from "../i18n"
import type { TFunction } from "i18next"
import i18next from "../i18next.server"
import SymbolLogo from "../components/symbolLogo"
import type { BestGainer } from "../../types/Prices"
import { Period } from "../../utils/getPrices"
import { SmallChart } from "../components/charts/smallChart"
import { ClientOnly } from "remix-utils/client-only"
import getHomePreferences from "../lib/getHomePreferences"

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
	const [t, homePreferences] = await Promise.all([
		i18next.getFixedT(request, "home"),
		getHomePreferences(request)
	])

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

	const memoizedDownloadIcon = useMemo(() => <MdDownload />, [])

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

	const menus = [{
		name: "bestGainers",
		component: () => (
			<>
				<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
					<MdShowChart />

					{t("bestGainers")}
				</h2>

				<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
					<DisplayBestGainers
						t={t}
					/>
				</div>
			</>
		)
	}, {
		name: "news",
		component: () => (
			<>
				<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
					<MdNewspaper />

					{t("lastNews")}
				</h2>

				<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
					<DisplayLastNews
						t={t}
						language={i18n.language}
					/>
				</div>

				<Link to="/news">
					<Button variant="default">{t("seeMore")}</Button>
				</Link>
			</>
		)
	}, {
		name: "events",
		component: () => (
			<>
				<h2 className="flex flex-row items-center gap-2 font-bold text-lg">
					<MdCalendarToday />

					{t("nextEvents")}
				</h2>

				<div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
					<DisplayNextEvents
						t={t}
						language={i18n.language}
					/>
				</div>

				<Link to="/calendar">
					<Button variant="default">{t("seeMore")}</Button>
				</Link>
			</>
		)
	}]

	console.log(homePreferences)

	const sortedPreferences = homePreferences.filter((pref) => pref.visible).sort((a, b) => a.position - b.position)
	const displayedMenu = sortedPreferences.map((pref) => menus.find((menu) => menu.name === pref.id)).filter((menu) => menu !== undefined)

	return (
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

				<h1 className="font-bold text-xl">
					{t("welcome")}
				</h1>
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
				<div className="flex max-w-full flex-col items-center gap-2 p-4" key={menu.name}>
					{menu.component()}
				</div>
			))}
		</div>
	)
}

const DisplayDate = memo(function DisplayDate({ date, locale }: { date: number, locale: string }) {
	const d = new Date(date * 1000)

	const formattedDate = formatDistanceToNow(d, {
		locale: dateFns[locale],
		addSuffix: true
	})

	return <p>{formattedDate}</p>
})

const DisplayBestGainers = memo(function DisplayBestGainers({
	t,

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

	if (error) {
		return <p>{t("errors.loading")}</p>
	}

	if (isPending) {
		return new Array(10).fill(null).map((_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal" key={index}>
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
			<Card className="relative size-80 whitespace-normal">
				<CardTitle className="flex flex-row items-center justify-center gap-2 p-4 text-center">
					<SymbolLogo symbol={gainer} className="size-6 rounded-full" alt={gainer.description} />

					{gainer.description}
				</CardTitle>
				<CardContent className="flex flex-col items-center justify-center gap-4 p-4">
					<p className="flex flex-row items-center gap-2">
						{gainer.close}{gainer.currency}
						<span className="text-green-600">+{Number(gainer.change).toFixed(2)}%</span>
					</p>

					{/* <SmallChart prices={gainer.prices} /> */}
				</CardContent>
			</Card>
		</Link>
	))
})

const DisplayLastNews = memo(function DisplayLastNews({
	t,
	language
}: {
	t: TFunction,
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
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal" key={index}>
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
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal">
				<CardTitle className="p-4 text-center">{news.news.title}</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<p className="h-24 max-h-24 overflow-clip">{news.news_article.shortDescription}</p>

					<div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
						<p>{t("by")} {news.news.source}</p>
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
	t: TFunction,
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
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal" key={index}>
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
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal">
				<CardTitle className="p-4 text-center">{event.title}</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<p className="h-24 max-h-24 overflow-clip">{event.comment}</p>

					<div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
						<p>{t("importance")} : {importance[event.importance]}</p>
						<p>{t("country")} : {countries[language][event.country]}</p>
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
