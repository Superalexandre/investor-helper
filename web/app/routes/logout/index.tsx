import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"

import { logout } from "../../session.server"

const redirectUrl = "/login"

export function action({ request }: ActionFunctionArgs) {
    return logout(request, redirectUrl)
}

export function loader({ request }: LoaderFunctionArgs) {
    return logout(request, redirectUrl)
}