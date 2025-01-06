import type { LoaderFunction } from "@remix-run/node"
import { authenticator } from "@/auth.server"

export const loader: LoaderFunction = ({ request }) => {
    return authenticator.authenticate("google", request)
}