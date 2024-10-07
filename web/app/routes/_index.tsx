import type { MetaFunction } from "@remix-run/node"
// import { usePush } from "@remix-pwa/push/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
// import { useLoaderData } from "@remix-run/react"
import { usePWAManager } from "@remix-pwa/client"
import { MdDownload } from "react-icons/md"
// import { useState } from "react"

export const meta: MetaFunction = () => {
    const title = "Investor Helper"
    const description = "Bienvenue sur Investor Helper"

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: "https://investor-helper.com" },
    ]
}

export function loader() {
    return {
        publicKey: process.env.NOTIFICATION_PUBLIC_KEY

    }
}

export default function Index() {
    // const { publicKey } = useLoaderData<typeof loader>()

    const { promptInstall } = usePWAManager()
    // const { subscribeToPush, unsubscribeFromPush, isSubscribed, pushSubscription } = usePush()
    // const [notificationError, setNotificationError] = useState<string | null>(null)

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
                />

                <h1 className="text-xl font-bold">Bienvenue sur <span>Investor Helper</span></h1>
            </div>

            <div className="flex flex-col items-center justify-start gap-2">
                <Label>
                    Installer l'application
                </Label>
                <Button
                    onClick={() => {
                        promptInstall(() => {
                            console.log("Installation réussie")
                        })
                    }}
                    className="flex items-center justify-center gap-2"
                >
                    Installer

                    <MdDownload/>
                </Button>
            </div>

            {/* <div className="flex flex-col items-center justify-center gap-2">
                <Label>
                    Notifications
                </Label>
                <Button
                    onClick={() => {
                        if (isSubscribed) {
                            unsubscribeFromPush(() => {
                                console.log("Unsubscribed")

                                fetch("/api/notifications/unsubscribe", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        pushSubscription
                                    })
                                })
                            })
                        } else {
                            if (!publicKey) return console.error("No public key")

                            subscribeToPush(publicKey, (subscription) => {
                                console.log("subscription", subscription)

                                fetch("/api/notifications/subscribe", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify(subscription)
                                })
                            }, (error) => {
                                console.error("error", error)

                                setNotificationError(error.message)
                            })
                        }
                    }}
                >
                    {isSubscribed ? "Désactiver" : "Activer"}
                </Button>
                {notificationError ? (
                    <Label className="text-sm text-red-500">
                        {notificationError}
                    </Label>
                ) : null}

            </div> */}
        </div>

    )
}