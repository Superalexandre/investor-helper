import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useBadgeApi, useBatteryManager } from "@remix-pwa/client"
import { usePush } from "@remix-pwa/push/client"
import { useLoaderData } from "@remix-run/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function loader() {
	return {
		publicKey: process.env.NOTIFICATION_PUBLIC_KEY
	}
}

export const handle = {
	i18n: "home"
}

export default function Index() {
	const { i18n } = useTranslation("home")
	const { publicKey } = useLoaderData<typeof loader>()

	const { badgeCount, setBadgeCount, showNotificationDot, clearBadge } = useBadgeApi()
	const { batteryLevel, isCharging } = useBatteryManager()

	const { subscribeToPush, unsubscribeFromPush, isSubscribed, pushSubscription } = usePush()
	const [notificationError, setNotificationError] = useState<string | null>(null)

	const [code, setCode] = useState("")

	if (!code || code !== "0403") {
		return (
			<div className="flex flex-col items-center justify-center gap-4">
				<Label>Enter the code</Label>
				<input type="text" value={code} onChange={(e) => setCode(e.target.value)} />
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center gap-16">
			<div className="flex flex-col items-center justify-center">
				<p>Badge Count: {badgeCount}</p>

				<div className="flex flex-col items-center justify-center">
					<button type="button" onClick={() => setBadgeCount(badgeCount + 1)}>
						Increment
					</button>
					<button type="button" onClick={() => setBadgeCount(badgeCount - 1)}>
						Decrement
					</button>
					<button type="button" onClick={() => setBadgeCount(0)}>
						Reset
					</button>
					<button type="button" onClick={clearBadge}>
						Clear Badge
					</button>
					<button type="button" onClick={showNotificationDot}>
						Show Notification Dot
					</button>
				</div>
			</div>

			<div className="flex flex-col items-center justify-center">
				<p>Battery Level: {batteryLevel}</p>
				<p>Charging: {isCharging ? "Yes" : "No"}</p>
			</div>

			<div className="flex flex-col items-center justify-center gap-2">
				<Label>Notifications</Label>
				<Button
					onClick={() => {
						if (isSubscribed) {
							unsubscribeFromPush(() => {
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
							if (!publicKey) {
								return console.error("No public key")
							}

							subscribeToPush(
								publicKey,
								(subscription) => {
									fetch("/api/notifications/subscribe", {
										method: "POST",
										headers: {
											"Content-Type": "application/json"
										},
										body: JSON.stringify(subscription)
									})
								},
								(error) => {
									console.error("error", error)

									setNotificationError(error.message)
								}
							)
						}
					}}
				>
					{isSubscribed ? "Désactiver" : "Activer"}
				</Button>
				{notificationError ? <Label className="text-red-500 text-sm">{notificationError}</Label> : null}
			</div>
			
			<div className="flex flex-col items-center justify-center">
				<p>Language : {i18n.language}</p>
				
				<Button onClick={() => {
					i18n.changeLanguage("en-US")
				}}>English</Button>
				<Button onClick={() => {
					i18n.changeLanguage("fr-FR")
				}}>Français</Button>

			</div>
		</div>
	)
}
