import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"
import { getNextImportantEvent } from "../../../../../utils/events"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const limit = url.searchParams.get("limit") || "10"
	const parsedLimit = Number.parseInt(limit)

	const fromCalendar = new Date()
	const toCalendar = new Date()
	toCalendar.setDate(toCalendar.getDate() + 2)

	const events = await getNextImportantEvent(fromCalendar, toCalendar, 0, parsedLimit)

	return events
}
