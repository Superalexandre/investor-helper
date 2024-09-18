import { getUser } from "@/session.server"
import { ActionFunction, ActionFunctionArgs, json, redirect, /*redirect*/ } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { wallet as walletSchema, walletSymbols as walletSymbolsSchema } from "../../../../../../../db/schema/users"
import { eq } from "drizzle-orm"
import { normalizeSymbol } from "@/components/selectSymbol"

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
    const user = await getUser(request)
    if (!user) return json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.formData()

    // Get the wallet id from the query string
    const url = new URL(request.url)
    const walletId = url.searchParams.get("walletId") || body.get("walletId") as string

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


    const allSymbols = body.getAll("symbol").filter((s) => s !== "")
    const values = []
    for (const symbol of allSymbols) {
        const symbolJson = JSON.parse(symbol as string)

        console.log(symbolJson)

        const prefix = symbolJson["prefix"]?.toUpperCase() ?? (symbolJson.exchange as string).toUpperCase()

        values.push({
            walletId: wallet.walletId,
            symbol: `${prefix}:${normalizeSymbol(symbolJson.symbol)}`,
            quantity: symbolJson.quantity,
            buyPrice: symbolJson.price,
            currency: symbolJson.currency_code,
        })

    }

    await db
        .insert(walletSymbolsSchema)
        .values(values)

    return redirect(`/wallet/${wallet.walletId}`)
}