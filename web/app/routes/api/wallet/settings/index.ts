import type { ActionFunction } from "@remix-run/node"
import getWalletById from "../../../../../utils/getWallet"
import { getUser } from "../../../../session.server"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { walletSchema, walletSymbolsSchema } from "../../../../../../db/schema/users"
import { eq } from "drizzle-orm"

const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
const db = drizzle(sqlite)

export const action: ActionFunction = async ({ request }) => {
	const body = await request.json()

	if (!body || !body.walletId) {
		return {
			error: true,
			success: false,
			message: "Missing walletId"
		}
	}

	// Get the walletId from the body
	const wallet = await getWalletById({ id: body.walletId })

	if (!wallet) {
		return {
			error: true,
			success: false,
			message: "Wallet not found"
		}
	}

	const user = await getUser(request)

	if (!user) {
		return {
			error: true,
			success: false,
			message: "User not found"
		}
	}

	if (wallet.wallet.userId !== user.id) {
		return {
			error: true,
			success: false,
			message: "Unauthorized"
		}
	}

	// Update the wallet
    await db
        .update(walletSchema)
        .set({
            name: body.name ?? wallet.wallet.name,
            description: body.description ?? wallet.wallet.description,
            private: body.isPrivate ?? wallet.wallet.private
        })
        .where(eq(walletSchema.walletId, body.walletId))

	return {
        error: false,
        success: true,
        message: "Wallet updated successfully"
    }
}
