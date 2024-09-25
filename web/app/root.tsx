import { LinksFunction, LoaderFunctionArgs } from "@remix-run/node"
import {
    Link,
    // ClientLoaderFunctionArgs,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useRouteError,
    // useLoaderData,
    useRouteLoaderData,
} from "@remix-run/react"

import stylesheet from "@/tailwind.css?url"
import Header from "./components/header"
import { getUser } from "./session.server"
import { Button } from "./components/ui/button"

export async function loader({
    request
}: LoaderFunctionArgs) {
    const user = await getUser(request)

    return { logged: user !== null }
}

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: stylesheet },
]

export function Layout({ children }: { children: React.ReactNode }) {
    // useSWEffect()
    const data = useRouteLoaderData<typeof loader>("root")

    return (
        <html lang="fr" className="dark" translate="no">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
                {/* <ManifestLink /> */}

                {/* <meta name="theme-color" content="#000000" /> */}
            </head>
            <body className="flex min-h-screen flex-col">
                <Header
                    logged={data?.logged ?? false}
                />

                {children}

                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {

    // useNetworkConnectivity({
    //     onOnline: () => {
    //         const id = "network-connectivity"
    //         const title = "You are back online"
    //         const description = "Seemed your network went for a nap, glad to have you back!"
    //         const type = "message"

    //         toast[type](title, { id, description })
    //     },

    //     onOffline: () => {
    //         const id = "network-connectivity"
    //         const title = "You are offline"
    //         const description = "Seems like you are offline, check your network connection"
    //         const type = "warning"

    //         toast[type](title, { id, description })
    //     }
    // })

    return <Outlet />
}

export function ErrorBoundary() {
    const error = useRouteError()

    console.error(typeof error)

    if (error && typeof error === "object" && "status" in error && error.status === 404) {
        return (
            <div className="flex flex-grow flex-col items-center justify-center gap-4">
                <h1 className="text-3xl font-bold">Page introuvable</h1>
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
            <h1 className="text-3xl font-bold text-red-500">Une erreur est survenue !</h1>
            <Link to="/">
                <Button type="button" variant="default">
                    Retour à l'accueil
                </Button>
            </Link>
        </div>
    )
}