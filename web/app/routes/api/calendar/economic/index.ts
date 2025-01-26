import type { LoaderFunction, LoaderFunctionArgs } from "react-router";
import { getEvents } from "../../../../../utils/events"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const limit = url.searchParams.get("limit")
	const page = url.searchParams.get("page")

	const month = url.searchParams.get("month")
	const year = url.searchParams.get("year")

	// Convert the limit and page to numbers
	const limitResult = limit ? Number.parseInt(limit) : 60
	const pageResult = page ? Number.parseInt(page) : 1
	
	const events = await getEvents({
		limit: limitResult,
		page: pageResult,
		order: "asc",
		month: month ? Number.parseInt(month) : undefined,
		year: year ? Number.parseInt(year) : undefined
	})

	// Await fake delay
	// await new Promise(resolve => setTimeout(resolve, 10_000))

	return events
}
