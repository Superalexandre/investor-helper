import { useState, memo, type Dispatch, type SetStateAction } from "react"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "../ui/dialog"
import { Button } from "../ui/button"
import { usePush } from "@remix-pwa/push/client"
import config from "@/lib/config"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

interface DialogNotificationProps {
	open: boolean
	setOpen: Dispatch<SetStateAction<boolean>>
}

export default memo(function DialogNotification({ open, setOpen }: DialogNotificationProps) {
	const { subscribeToPush, isSubscribed, requestPermission } = usePush()
	// biome-ignore lint/suspicious/noExplicitAny: The error is an any type
	const [error, setError] = useState<string | any>(null)

	const subscribe = async () => {
		if (isSubscribed) {
			setOpen(false)

			return
		}

		
		// Check if the permission are blocked
		if (Notification.permission === "denied") {
			setError({
				message: "Vous avez refusé les notifications"
			})

			return
		}

		subscribeToPush(
			config.publicKey,
			(subscription) => {
				fetch("/api/notifications/subscribe", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(subscription)
				})
					.then((rep) => {
						return rep.json()
					})
					.then(() => {
						setOpen(false)
					})
			},
			(error) => {
				console.error("error", error)

				if (error instanceof Error && error.message === "Registration failed - permission denied") {
					setError({
						...error,
						message: "Vous avez refusé les notifications"
					})

					return
				}

				setError(error)

				return
			}
		)
	}

	return (
		<Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
			<DialogContent className="w-11/12">
				<DialogHeader>
					<DialogTitle>Accepter les notifications</DialogTitle>
					<DialogDescription>Accepter les notifications pour recevoir des alertes</DialogDescription>
				</DialogHeader>

				{error ? (
					<Alert variant="destructive">
						<AlertTitle>Une erreur est survenue!</AlertTitle>
						<AlertDescription>
							{error.message || "Une erreur est survenue lors de l'abonnement aux notifications"}
						</AlertDescription>
					</Alert>
				) : null}
				<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
					<DialogClose asChild={true}>
						<Button variant="destructive" type="reset">
							Fermer
						</Button>
					</DialogClose>
					<Button variant="default" type="submit" onClick={subscribe}>
						Ajouter
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
})
