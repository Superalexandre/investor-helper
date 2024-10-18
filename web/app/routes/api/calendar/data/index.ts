import { json, type LoaderFunction, type LoaderFunctionArgs } from "@remix-run/node"
import { getEvents } from "../../../../../utils/events"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const limit = url.searchParams.get("limit")
	const page = url.searchParams.get("page")

	// Convert the limit and page to numbers
	const limitResult = limit ? Number.parseInt(limit) : 60
	const pageResult = page ? Number.parseInt(page) : 1

	const events = await getEvents({
		limit: limitResult,
		page: pageResult,
		desc: "asc"
	})

    // Await fake delay
    // await new Promise(resolve => setTimeout(resolve, 5000))

	return json(events)
}
