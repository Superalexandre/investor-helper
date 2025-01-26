import { getUser } from "@/session.server"
import { type ActionFunction, type ActionFunctionArgs, json, redirect /*redirect*/ } from "react-router";
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { walletSchema, walletSymbolsSchema } from "../../../../../../../db/schema/users"
import { eq } from "drizzle-orm"
import { normalizeSymbolHtml } from "@/utils/normalizeSymbol"

interface Symbols {
	walletId: string
	symbol: string
	quantity: number
	buyPrice: number
	currency: string
	buyAt: string
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
	const user = await getUser(request)
	if (!user) {
		return { error: "Unauthorized" }
	}

	const body = await request.formData()

	// Get the wallet id from the query string
	const url = new URL(request.url)
	const walletId = url.searchParams.get("walletId") || (body.get("walletId") as string)

	if (!walletId) {
		return { error: "Missing walletId" }
	}

	// Check if the wallet exists

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const walletResults = await db.select().from(walletSchema).where(eq(walletSchema.walletId, walletId))

	if (walletResults.length === 0) {
		return { error: "Wallet not found" }
	}

	const wallet = walletResults[0]
	// Check if the wallet belongs to the user
	if (wallet.userId !== user.id) {
		return { error: "Unauthorized" }
	}

	const allSymbols = body.getAll("symbol").filter((s) => s !== "")
	const values: Symbols[] = []
	for (const symbol of allSymbols) {
		const symbolJson = JSON.parse(symbol as string)

		const prefix = symbolJson.prefix?.toUpperCase() ?? (symbolJson.exchange as string).toUpperCase()

		values.push({
			walletId: wallet.walletId,
			symbol: `${prefix}:${normalizeSymbolHtml(symbolJson.symbol)}`,
			quantity: symbolJson.quantity <= 0 ? 0 : symbolJson.quantity,
			buyPrice: symbolJson.price <= 0 ? 0 : symbolJson.price,
			currency: symbolJson.currency_code,
			buyAt: symbolJson.buyAt
		})
	}

	if (values.length > 0) {
		await db.insert(walletSymbolsSchema).values(values)
	}

	return redirect(`/wallet/${wallet.walletId}`)
}
