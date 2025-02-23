import { json } from "@tanstack/start"
import { createAPIFileRoute } from "@tanstack/start/api"
import { getEvents } from "../../../../../utils/events"

export const APIRoute = createAPIFileRoute("/api/calendar/economic")({
	GET: async ({ request }) => {
		const url = new URL(request.url)
		const limit = url.searchParams.get("limit")
		const page = url.searchParams.get("page")
		const month = url.searchParams.get("month")
		const year = url.searchParams.get("year")

		// Convertir les paramètres en nombres
		const limitResult = limit ? Number.parseInt(limit) : 60
		const pageResult = page ? Number.parseInt(page) : 1

		try {
			const events = await getEvents({
				limit: limitResult,
				page: pageResult,
				order: "asc",
				month: month ? Number.parseInt(month) : undefined,
				year: year ? Number.parseInt(year) : undefined
			})

			// Regrouper les événements
			const groupedEvents = events.reduce(
				(acc, event) => {
					const key = `${event.country}-${event.date}`
					if (!acc[key]) {
						acc[key] = []
					}
					acc[key].push(event)
					return acc
				},
				{} as Record<string, typeof events>
			)

			return json(Object.values(groupedEvents))
		} catch (e) {
			console.error(e)
			return json({ error: "Failed to fetch events" }, { status: 500 })
		}
	}
})
