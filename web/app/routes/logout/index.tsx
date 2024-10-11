import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"

import { logout } from "../../session.server"

const redirectUrl = "/login"

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Déconnexion"
	const description = ""

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://investor-helper.com/logout" }
	]
}
export function action({ request }: ActionFunctionArgs) {
	return logout(request, redirectUrl)
}

export function loader({ request }: LoaderFunctionArgs) {
	return logout(request, redirectUrl)
}
