import type { Dispatch, SetStateAction } from "react"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "./ui/dialog"
import { Button } from "./ui/button"
import { usePush } from "@remix-pwa/push/client"
import config from "@/lib/config"

interface DialogNotificationProps {
	open: boolean
	setOpen: Dispatch<SetStateAction<boolean>>
}

export default function DialogNotification({ open, setOpen }: DialogNotificationProps) {
	const { subscribeToPush, isSubscribed } = usePush()

	const subscribe = async () => {
		if (isSubscribed) {
			setOpen(false)

			return
		}

		subscribeToPush(
			config.publicKey,
			(subscription) => {
				console.log("subscription", subscription)

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
}
