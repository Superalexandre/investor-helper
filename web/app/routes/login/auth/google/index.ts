import { authenticator } from "@/auth.server"
import type { ActionFunction, LoaderFunction } from "@remix-run/node"
import { getSession, sessionStorage } from "../../../../session.server"

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	let redirectUrl = url.searchParams.get("redirect") || "/profile"

	if (["/login", "/register"].includes(redirectUrl)) {
		redirectUrl = "/profile"
	}

	const session = await getSession(request)
	session.set("redirect", redirectUrl)

	// Change the request
	const newRequest = new Request(request, {
		headers: new Headers({
			...request.headers,
			cookie: await sessionStorage.commitSession(session)
		})
	})

	return authenticator.authenticate("google", newRequest, {
		context: {
			redirectUrl
		}
	})
}

export const action: ActionFunction = ({ request }) => {
	return authenticator.authenticate("google", request)
}
