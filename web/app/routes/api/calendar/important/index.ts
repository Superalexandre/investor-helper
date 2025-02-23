import { json } from "@tanstack/start"
import { createAPIFileRoute } from "@tanstack/start/api"
import { getNextImportantEvent } from "../../../../../utils/events"

export const APIRoute = createAPIFileRoute("/api/calendar/important")({
	GET: async ({ request }) => {
		const url = new URL(request.url)
		const limit = url.searchParams.get("limit") || "10"
		const parsedLimit = Number.parseInt(limit)

		const fromCalendar = new Date()
		const toCalendar = new Date()
		toCalendar.setDate(toCalendar.getDate() + 2)

		try {
			const events = await getNextImportantEvent(fromCalendar, toCalendar, 0, parsedLimit)

			return json(events)
		} catch (e) {
			console.error(e)
			return json({ error: "Failed to fetch events" }, { status: 500 })
		}
	}
})
