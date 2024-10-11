import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node"
import {
	Link,
	// ClientLoaderFunctionArgs,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useNavigate,
	useRouteError,
	// useLoaderData,
	useRouteLoaderData
} from "@remix-run/react"
import { ManifestLink, useSWEffect } from "@remix-pwa/sw"
import { useNetworkConnectivity } from "@remix-pwa/client"

import stylesheet from "@/tailwind.css?url"
import Header from "./components/header"
import { getUser } from "./session.server"
import { Button } from "./components/ui/button"
import { type ReactNode, useEffect } from "react"
import { Toaster } from "./components/ui/toaster"
import { useToast } from "./hooks/use-toast"
import { ToastAction } from "./components/ui/toast"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { sourceTracking as sourceTrackingSchema } from "@/schema/sourceTracking"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)
	const url = new URL(request.url)

	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	// Get the utm_source query parameter
	const utmSource = url.searchParams.get("utm_source")

	if (utmSource) {
		db.insert(sourceTrackingSchema).values({
			source: utmSource,
			fullUrl: url.href,
			isLogged: user !== null,
			type: "utm"
		})
	}

	return { logged: user !== null }
}

// export async function workerLoader({ request }: WorkerLoaderArgs) {
//     console.log("Worker loader", request.url)

//     return null
// }

export const links: LinksFunction = () => [{ rel: "stylesheet", href: stylesheet, as: "style", type: "text/css" }]

export function Layout({ children }: { children: ReactNode }) {
	useSWEffect()

	const data = useRouteLoaderData<typeof loader>("root")

	return (
		<html lang="fr" className="dark bg-background" translate="no">
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

				{/* <meta property="og:title" content="Investor Helper - Stay Updated on Financial News" /> */}
				{/* <meta property="og:description" content="Get the latest financial news and track investment opportunities with our comprehensive calendar." /> */}
				<meta property="og:url" content="https://www.investor-helper.com" />
				<meta property="og:type" content="website" />
				<meta property="og:image" content="https://www.investor-helper.com/logo-512-512.png" />
				<meta property="og:locale" content="fr_FR" />

				<meta name="mobile-web-app-capable" content="yes" />

				{/* <meta name="apple-mobile-web-app-title" content="Investor Helper" />
                <meta name="application-name" content="Investor Helper" />

                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /> */}
			</head>
			<body className="flex min-h-screen flex-col">
				<Header logged={data?.logged ?? false} />

				{children}

				<Toaster />

				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	const { toast } = useToast()
	const navigate = useNavigate()

	const queryClient = new QueryClient()

	useNetworkConnectivity({
		onOnline: () => {
			// const id = "network-connectivity"
			// const title = "You are back online"
			// const description = "Seemed your network went for a nap, glad to have you back!"
			// const type = "message"

			console.log("You are back online")
			// toast[type](title, {id, description})
		},

		onOffline: () => {
			// const id = "network-connectivity"
			// const title = "You are offline"
			// const description = "Seems like you are offline, check your network connection"
			// const type = "warning"

			// toast[type](title, {id, description})
			console.log("You are offline")
		}
	})

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener("message", (event) => {
				console.log("SW message", event)

				if (event.data && event.data.type === "notification") {
					toast({
						title: event.data.title,
						description: event.data.body,
						action: (
							<ToastAction altText="Ouvrir" onClick={() => navigate(event.data.url)}>
								Ouvrir
							</ToastAction>
						)
					})
				}
			})
		}
	}, [navigate, toast])

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
		</QueryClientProvider>
	)
}

export function ErrorBoundary() {
	const error = useRouteError()

	// console.error(typeof error)

	if (error && typeof error === "object" && "status" in error && error.status === 404) {
		return (
			<div className="flex flex-grow flex-col items-center justify-center gap-4">
				<h1 className="font-bold text-3xl">Page introuvable</h1>
				<p>Désolé la page que vous cherchez n'est pas trouvable.</p>
				<Link to="/">
					<Button type="button" variant="default">
						Retour à l'accueil
					</Button>
				</Link>
			</div>
		)
	}

	return (
		<div className="flex flex-grow flex-col items-center justify-center gap-4">
			<h1 className="text-center font-bold text-3xl text-red-500">Une erreur est survenue !</h1>

			{error && typeof error === "object" && "message" in error ? (
				<p>{error.message as string}</p>
			) : (
				<p>Une erreur est survenue lors du chargement de la page.</p>
			)}

			{error && typeof error === "object" && "status" in error ? <p>{error.status as string}</p> : null}

			<Link to="/">
				<Button type="button" variant="default">
					Retour à l'accueil
				</Button>
			</Link>
		</div>
	)
}
