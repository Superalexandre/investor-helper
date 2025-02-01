import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { usePWAManager } from "@remix-pwa/client"
import { useLoaderData } from "@remix-run/react"
import { useEffect, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import i18next from "../../i18next.server"
import getHomePreferences from "../../lib/getHomePreferences"
import { DownloadIcon } from "lucide-react"
import MarketHours from "./MarketHours"
import News from "./News"
import Events from "./Events"
import BestLosers from "./BestLosers"
import BestGainers from "./BestGainers"
import { Carousel, CarouselContent } from "../../components/ui/carousel"

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

export default function Index(): ReactNode {
	const { homePreferences } = useLoaderData<typeof loader>()
	const { t, i18n } = useTranslation("home")

	const { promptInstall } = usePWAManager()

	const [isInstalled, setIsInstalled] = useState(true)

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
			component: (): ReactNode => <MarketHours t={t} language={i18n.language} />
		},
		{
			name: "bestLosers",
			component: (): ReactNode => <BestLosers t={t} />
		},
		{
			name: "bestGainers",
			component: (): ReactNode => <BestGainers t={t} />
		},
		{
			name: "news",
			component: (): ReactNode => <News t={t} language={i18n.language} />
		},
		{
			name: "events",
			component: (): ReactNode => <Events t={t} language={i18n.language} />
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
							<DownloadIcon />
						</Button>
					</div>
				)}

				{displayedMenu.map((menu) => (
					<div className="flex w-full max-w-full flex-col items-center gap-2 p-4" key={menu.name}>
						{menu.component()}
					</div>
					// <Carousel key={menu.name}>
					// 	<CarouselContent className="-ml-2 md:-ml-4">
					// 		{menu.component()}
					// 		{/* <CarouselItem className="pl-2 md:pl-4">...</CarouselItem>
					// 		<CarouselItem className="pl-2 md:pl-4">...</CarouselItem>
					// 		<CarouselItem className="pl-2 md:pl-4">...</CarouselItem> */}
					// 	</CarouselContent>
					// </Carousel>
				))}
			</div>

			{/* <Footer /> */}
		</div>
	)
}