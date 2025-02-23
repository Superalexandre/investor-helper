import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18next from "../i18next.server";
import getHomePreferences from "../lib/getHomePreferences";
import { DownloadIcon } from "lucide-react";
import MarketHours from "../components/home/MarketHours";
import News from "../components/home/News";
import Events from "../components/home/Events";
import BestLosers from "../components/home/BestLosers";
import BestGainers from "../components/home/BestGainers";
import { usePWAManager } from "../hooks/pwa/usePWAManager";

const getHomeData = createServerFn({ method: "GET" }).handler(
	async ({ context }) => {
		// const [t, homePreferences] = await Promise.all([
		// 	i18next.getFixedT(request, "home"),
		// 	getHomePreferences(request),
		// ]);

		// const homePreferences = await getHomePreferences();

		// const title = t("title");
		// const description = t("description");

		// return {
		// 	title,
		// 	description,
		// 	publicKey: process.env.NOTIFICATION_PUBLIC_KEY,
		// 	homePreferences,
		// };
	}
);

export const Route = createFileRoute("/")({
	component: Index,
	// loader: async ({ request }) => {
	// 	const [t, homePreferences] = await Promise.all([
	// 		i18next.getFixedT(request, "home"),
	// 		getHomePreferences(request),
	// 	]);

	// 	return {
	// 		homePreferences,
	// 	};
	// },
});

function Index(): ReactNode {
	const router = useRouter();
	// const { homePreferences } = Route.useLoaderData();
	const { t } = useTranslation("home");

	// const { promptInstall } = usePWAManager();
	const [isInstalled, setIsInstalled] = useState(true);

	useEffect(() => {
		const isTwa = document.referrer.startsWith("android-app://");
		const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
		const isMinimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;
		const isFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
		const isWindowControlsOverlay = window.matchMedia(
			"(display-mode: window-controls-overlay)"
		).matches;

		if (isTwa || isStandalone || isMinimalUi || isFullscreen || isWindowControlsOverlay) {
			setIsInstalled(true);
		} else {
			setIsInstalled(false);
		}
	}, []);

	const menus = [
		{
			name: "marketHours",
			component: (): ReactNode => <MarketHours t={t} language={"fr-FR"} />,
		},
		{
			name: "bestLosers",
			component: (): ReactNode => <BestLosers t={t} />,
		},
		{
			name: "bestGainers",
			component: (): ReactNode => <BestGainers t={t} />,
		},
		{
			name: "news",
			component: (): ReactNode => <News t={t} language={"fr-FR"} />,
		},
		{
			name: "events",
			component: (): ReactNode => <Events t={t} language={"fr-FR"} />,
		},
	];

	// const sortedPreferences = homePreferences
	// 	.filter((pref) => pref.visible)
	// 	.sort((a, b) => a.position - b.position);
	// const displayedMenu = sortedPreferences
	// 	.map((pref) => menus.find((menu) => menu.name === pref.id))
	// 	.filter((menu) => menu !== undefined);

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
							// onClick={() => promptInstall()}
							className="flex items-center justify-center gap-2"
						>
							{t("download")}
							<DownloadIcon />
						</Button>
					</div>
				)}

				{menus.map((menu) => (
					<div className="flex w-full max-w-full flex-col items-center gap-2 p-4" key={menu.name}>
						{menu.component()}
					</div>
				))}
			</div>
		</div>
	);
}
