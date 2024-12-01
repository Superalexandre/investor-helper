import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node"
import {
	isRouteErrorResponse,
	Link,
	// ClientLoaderFunctionArgs,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
	useRouteLoaderData
} from "@remix-run/react"
import { ManifestLink, useSWEffect } from "@remix-pwa/sw"
import stylesheet from "@/tailwind.css?url"
import Header from "@/components/header"
import { getUser } from "./session.server"
import { Button } from "@/components/ui/button"
import { type ReactNode, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { sourceTrackingSchema } from "@/schema/sourceTracking"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { toast as sonner } from "sonner"
import i18next from "./i18next.server"
import { useTranslation } from "react-i18next"
import { useChangeLanguage } from "remix-i18next/react"
import { getTheme } from "./lib/getTheme"

export async function loader({ request }: LoaderFunctionArgs) {
	const [user, theme, locale] = await Promise.all([getUser(request), getTheme(request), i18next.getLocale(request)])

	const url = new URL(request.url)

	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	// Get the utm_source query parameter
	const utmSource = url.searchParams.get("utm_source")

	if (utmSource) {
		await db.insert(sourceTrackingSchema).values({
			source: utmSource,
			fullUrl: url.href,
			isLogged: user !== null,
			type: "utm"
		})
	}

	return { logged: user !== null, user, locale, theme: theme }
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: stylesheet, as: "style", type: "text/css" }]
export const handle = {
	i18n: "common"
}

export function Layout({ children }: { children: ReactNode }) {
	const data = useRouteLoaderData<typeof loader>("root")
	const { i18n, t } = useTranslation("common")

	useSWEffect()

	const locale = data?.locale ?? "fr-FR"
	const theme = data?.theme ?? "light"

	useChangeLanguage(locale)

	return (
		<html
			lang={locale}
			dir={i18n.dir()}
			className={`${theme === "dark" ? "dark" : ""} bg-background`}
			translate="no"
		>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<ManifestLink />

				<link rel="manifest" href="/manifest.webmanifest" />

				<meta
					name="keywords"
					content="investment, financial news, stock market, economic calendar, investor tools"
				/>
				<meta name="robots" content="index, follow" />
				<meta name="theme-color" content="#0f172a" />

				<meta property="og:url" content="https://www.investor-helper.com" />
				<meta property="og:type" content="website" />
				<meta property="og:image" content="https://www.investor-helper.com/logo-512-512.png" />
				<meta property="og:locale" content="fr_FR" />

				<meta name="mobile-web-app-capable" content="yes" />
			</head>
			<body className="flex min-h-screen flex-col">
				<Header user={data?.user ?? null} t={t} />

				{children}

				<Toaster />
				<Sonner expand={false} visibleToasts={3} />

				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	const queryClient = new QueryClient()

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			const handleMessages = (event: MessageEvent) => {
				console.log("SW message", event)

				if (event.data && event.data.type === "notification") {
					const id = Date.now().toString()

					sonner(event.data.title, {
						description: event.data.body,
						closeButton: true,
						id: id,
						action: (
							<Link
								to={event.data.url}
								onClick={() => {
									sonner.dismiss(id)
								}}
							>
								<Button type="button" variant="default">
									Ouvrir
								</Button>
							</Link>
						)
					})
				}
			}

			navigator.serviceWorker.addEventListener("message", handleMessages)

			return () => {
				navigator.serviceWorker.removeEventListener("message", handleMessages)
			}
		}
	}, [])

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
		</QueryClientProvider>
	)
}

export function ErrorBoundary() {
	const { t } = useTranslation("common")
	const error = useRouteError()

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) {
			return (
				<div className="flex flex-grow flex-col items-center justify-center gap-4">
					<h1 className="font-bold text-3xl">{t("error.notFoundTitle")}</h1>
					<p>{t("error.notFoundMessage")}</p>
					<Link to="/">
						<Button type="button" variant="default">
							{t("backHome")}
						</Button>
					</Link>
				</div>
			)
		}

		return (
			<div className="flex flex-grow flex-col items-center justify-center gap-4">
				<h1 className="font-bold text-3xl">
					{t("error.errorTitle")} ({error.status})
				</h1>
				<p>{error.statusText}</p>
				<Link to="/">
					<Button type="button" variant="default">
						{t("backHome")}
					</Button>
				</Link>
			</div>
		)
	}

	if (error instanceof Error) {
		return (
			<div className="flex flex-grow flex-col items-center justify-center gap-4">
				<h1 className="font-bold text-3xl">{t("error.errorTitle")}</h1>
				<p>{error.message}</p>
				<Link to="/">
					<Button type="button" variant="default">
						{t("backHome")}
					</Button>
				</Link>
			</div>
		)
	}

	return (
		<div className="flex flex-grow flex-col items-center justify-center gap-4">
			<h1 className="font-bold text-3xl">{t("error.errorTtile")}</h1>

			<Link to="/">
				<Button type="button" variant="default">
					{t("backHome")}
				</Button>
			</Link>
		</div>
	)
}
