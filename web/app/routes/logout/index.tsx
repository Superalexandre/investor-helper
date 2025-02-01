import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"

import { logout } from "../../session.server"
// import i18next from "../../i18next.server"

// const redirectUrl = "/login"

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Déconnexion"
	const description = ""

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/logout"
		}
	]
}
export function action({ request }: ActionFunctionArgs) {
	const defaultRedirect = "/login"

	const url = new URL(request.url)
	const redirectUrl = url.searchParams.get("redirect") || defaultRedirect

	return logout(request, redirectUrl)
}

export function loader({ request }: LoaderFunctionArgs) {
	// const t = i18next.getFixedT(request, "logout")

	const defaultRedirect = "/login"

	const url = new URL(request.url)
	const redirectUrl = url.searchParams.get("redirect") || defaultRedirect

	return logout(request, redirectUrl)
}
