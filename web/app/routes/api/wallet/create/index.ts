import { getUser } from "@/session.server"
import { type ActionFunction, type ActionFunctionArgs, json, redirect } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { wallet as walletSchema } from "../../../../../../db/schema/users"

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
	const user = await getUser(request)
	if (!user) {
		return json({ error: "Unauthorized" }, { status: 401 })
	}

	const body = await request.formData()

	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const wallet = await db
		.insert(walletSchema)
		.values({
			userId: user.id,
			name: body.get("walletName")?.toString() || "Portefeuille",
			description: body.get("description")?.toString() || null
		})
		.returning({
			walletId: walletSchema.walletId
		})

	// const allSymbols = body.getAll("symbol").filter((s) => s !== "")
	// for (const symbol of allSymbols) {
	//     await db
	//         .insert(walletSymbolsSchema)
	//         .values({
	//             walletId: wallet[0].walletId,
	//             symbol: symbol.toString().toUpperCase(),
	//             quantity: 0,
	//             currency: "EUR",
	//         })
	// }

	return redirect(`/wallet/${wallet[0].walletId}`)
}
