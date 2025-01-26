import type { LoaderFunction } from "react-router";
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

    const resultWallet = await getWalletById({ id: walletId, token: user.token })

    if (!resultWallet) {
        return {
            success: false,
            error: true,
            message: "No wallet found",
        }
    }

    const moneyInvested = resultWallet.walletSymbols.reduce((acc, symbol) => acc + (symbol.buyPrice ?? 0) * symbol.quantity, 0)
    
    return {
        success: true,
        error: false,
        message: "Data fetched successfully",
        data: {
            ...resultWallet,
            moneyInvested
        }
    }
}
