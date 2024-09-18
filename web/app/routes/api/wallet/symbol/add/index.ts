import { getUser } from "@/session.server"
import { ActionFunction, ActionFunctionArgs, json, /*redirect*/ } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { wallet as walletSchema /*, walletSymbols as walletSymbolsSchema*/ } from "../../../../../../../db/schema/users"
import { eq } from "drizzle-orm"

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
    const user = await getUser(request)
    if (!user) return json({ error: "Unauthorized" }, { status: 401 })

    // Get the wallet id from the query string
    const url = new URL(request.url)
    const walletId = url.searchParams.get("walletId")

    if (!walletId) {
        return json({ error: "Missing walletId" }, { status: 400 })
    }

    // Check if the wallet exists

    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const walletResults = await db
        .select()
        .from(walletSchema)
        .where(eq(walletSchema.walletId, walletId))

    if (walletResults.length === 0) {
        return json({ error: "Wallet not found" }, { status: 404 })
    }

    const wallet = walletResults[0]
    // Check if the wallet belongs to the user
    if (wallet.userId !== user.id) {
        return json({ error: "Unauthorized" }, { status: 401 })
    }

    // const body = await request.formData()

    // const allSymbols = body.getAll("symbol").filter((s) => s !== "")
    // for (const symbol of allSymbols) {
    //     await db
    //         .insert(walletSymbolsSchema)
    //         .values({
    //             // walletId: wallet[0].walletId,
    //             symbol: symbol.toString(),
    //             quantity: 0
    //         })
    // }

    // return redirect(`/wallet/${wallet[0].walletId}`)
}