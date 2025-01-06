import { authenticator } from "@/auth.server"
import type { ActionFunction, LoaderFunction } from "@remix-run/node"

export const loader: LoaderFunction = ({ request }) => {
	return authenticator.authenticate("google", request)
}

export const action: ActionFunction = ({ request }) => {
	return authenticator.authenticate("google", request)
}