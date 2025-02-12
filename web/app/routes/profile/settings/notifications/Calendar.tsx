import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as sonner } from "sonner";
import type { ReactNode } from "react";
import { Label } from "../../../../components/ui/label";
import { Button } from "../../../../components/ui/button";
import { XIcon } from "lucide-react";
import { Link } from "@remix-run/react";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

export 
function CalendarNotifications({
	calendarNotifications
}: {
	calendarNotifications: { events: { id: string; title: string, country: string, comment: string } }[]
}): ReactNode {
	const queryClient = useQueryClient()

	const unsubscribeMutation = useMutation({
		mutationFn: async (id: string): Promise<string> => {
			const res = await fetch(`/api/notifications/unsubscribe/calendar/${id}`, {
				method: "POST"
			})

			return await res.json()
		},
		onSuccess: (): void => {
			queryClient.invalidateQueries({
				queryKey: ["notificationsInfo"]
			}).then(() => {
				sonner("Notification supprimée", {
					description: "La notification a été supprimée avec succès",
					closeButton: true
				})
			})
		}
	})

	return (
		<div className="flex w-full flex-col gap-4">
			{calendarNotifications.length > 0 ? (
				calendarNotifications.map(({ events }) => (
					<div key={events.id} className="flex items-center justify-between space-x-2">
						<div className="w-1/2 flex-grow">
							<Label htmlFor={events.id} className="flex w-3/4 flex-col space-y-1">
								<span>{events.title}</span>
								<span className="truncate font-normal text-muted-foreground text-sm">
									{events.country} • {events.comment}
								</span>
							</Label>
						</div>
						{/* <Switch
							id={events.id}
						/> */}
						<Button
							disabled={unsubscribeMutation.isPending}
							variant="ghost"
							size="icon"
							onClick={(): void => {
								unsubscribeMutation.mutate(events.id)
							}}
						>
							<XIcon className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" asChild={true}>
							<Link to={`/calendar/${events.id}`}>
								<ExternalLinkIcon className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				))
			) : (
				<p>Vous n'avez pas de notification de calendrier</p>
			)}
		</div>
	)
}