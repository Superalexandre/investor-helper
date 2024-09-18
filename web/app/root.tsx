import { LinksFunction } from "@remix-run/node"
import {
    ClientLoaderFunctionArgs,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from "@remix-run/react"

import stylesheet from "@/tailwind.css?url"
import Header from "./components/header"
import { getUser } from "./session.server"

export async function loader({
    request
}: ClientLoaderFunctionArgs) {
    const user = await getUser(request)

    return { logged: user !== null }
}

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: stylesheet },
]

export function Layout({ children }: { children: React.ReactNode }) {
    // useSWEffect()
    const { logged } = useLoaderData<typeof loader>()

    return (
        <html lang="en" className="dark">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
                {/* <ManifestLink /> */}

                <meta name="theme-color" content="#000000" />
            </head>
            <body className="flex min-h-screen flex-col">
                <Header 
                    logged={logged}
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