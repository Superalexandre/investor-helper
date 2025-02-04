import type { LoaderFunction } from "@remix-run/node"
import getWalletById from "../../../../../utils/getWallet"
import { getUser } from "../../../../session.server"

export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url)
    const walletId = url.searchParams.get("walletId")

    if (!walletId) {
        return {
            success: false,
            error: true,
            message: "Missing walletId parameter",
        }
    }

    const user = await getUser(request)

    if (!user) {
        return {
            success: false,
            error: true,
            message: "Must be logged",
        }
    }

    console.log("walletId", walletId)

    const resultWallet = await getWalletById({ id: walletId, token: user.token })

    if (!resultWallet) {
        return {
            success: false,
            error: true,
            message: "No wallet found",
        }
    }

    // Download the wallet
    const wallet = JSON.stringify(resultWallet)

    return wallet
}
