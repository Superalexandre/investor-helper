import type { LoaderFunction } from "react-router";
import { authenticator } from "@/auth.server"

export const loader: LoaderFunction = ({ request }) => {
    return authenticator.authenticate("google", request)
}