import { useFetcher } from "@remix-run/react"
import { Button } from "../ui/button"
import Loading from "../loading"
import { MdDelete } from "react-icons/md"

export default function DeleteNewsNotification({ notificationId }: { notificationId: string }) {
	const fetcher = useFetcher()
	const fetchState = fetcher.state
	const fetchId = fetcher.formAction?.split("/").pop()

	return (
		<fetcher.Form method="post" action={`/api/notifications/unsubscribe/news/${notificationId}`}>
			<Button
				type="submit"
				variant="destructive"
				className="flex flex-row items-center justify-center gap-2"
				disabled={fetchId === notificationId && (fetchState === "loading" || fetchState === "submitting")}
			>
				Supprimer
				{fetchId === notificationId && (fetchState === "loading" || fetchState === "submitting") ? (
					<Loading className="size-4 border-2" />
				) : (
					<MdDelete className="size-4" />
				)}
			</Button>
		</fetcher.Form>
	)
}