import { getUser } from "@/session.server"
import { type ActionFunction, type ActionFunctionArgs, json, redirect /*redirect*/ } from "@remix-run/node"
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

	const body = await request.json()

	// Get the wallet id from the query string
	// const walletId = body.get("walletId")
	const walletId = body.walletId

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

	if (!body || !body.symbols || !Array.isArray(body.symbols) || body.symbols.length === 0) {
		return { error: "Missing symbols" }
	}

	// const allSymbols = body.symbols.filter((s) => s !== "")
	const values: Symbols[] = []
	for (const symbol of body.symbols) {
		const prefix = symbol.prefix?.toUpperCase() ?? (symbol.exchange as string).toUpperCase()

		values.push({
			walletId: wallet.walletId,
			symbol: `${prefix}:${normalizeSymbolHtml(symbol.symbol)}`,
			quantity: symbol.quantity <= 0 ? 0 : symbol.quantity,
			buyPrice: symbol.price <= 0 ? 0 : symbol.price,
			currency: symbol.currency_code,
			buyAt: symbol.buyAt
		})
	}

	if (values.length > 0) {
		await db.insert(walletSymbolsSchema).values(values)
	}

	return {
		error: false,
		success: true,
		message: "Symbols added successfully"
	}
}
