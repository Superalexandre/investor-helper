import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { users } from "./users"
// import { createId } from "@paralleldrive/cuid2"
// import crypto from "node:crypto"
// import { v4 as uuidv4 } from "uuid"
// import { symbols } from "./symbols.js"

export const notification = sqliteTable("notifications", {
	userId: text("user_id").references(() => users.id),
	// id: text("id")
	//     .primaryKey()
	//     .unique(),
	endpoint: text("endpoint").notNull(),
	p256dh: text("p256dh").notNull(),
	auth: text("auth").notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	plateform: text("plateform").default("web").notNull()

	// id: text("id")
	//     .primaryKey()
	//     .unique()
	//     .notNull()
	//     .$defaultFn(() => {
	//         return uuidv4()
	//     }),
	// token: text("token")
	//     .unique()
	//     .notNull()
	//     .$defaultFn(() => {
	//         return crypto.randomBytes(32).toString("hex")
	//     }),
	// username: text("username")
	//     .notNull()
	//     .unique(),
	// displayName: text("display_name"),
	// avatar: text("avatar"),
	// firstName: text("first_name")
	//     .notNull(),
	// lastName: text("last_name")
	//     .notNull(),
	// email: text("email")
	//     .unique(),
	// password: text("password")
	//     .notNull(),
	// salt: text("salt")
	//     .notNull(),
	// createdAt: text("created_at")
	//     .notNull()
	//     .$defaultFn(() => new Date().toISOString()),
	// updatedAt: text("updated_at")
	//     .$defaultFn(() => new Date().toISOString())
	//     .notNull(),
})

export type Notifications$ = typeof notification.$inferSelect

// export const subscribedNotifications = sqliteTable("subscribed_notifications", {
//     userId: text("user_id").references(() => users.id),
//     createdAt: text("created_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
//     updatedAt: text("updated_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
// })

// export const watchList = sqliteTable("watch_list", {
//     userId: text("user_id").references(() => users.id),
//     listId: text("list_id")
//         .notNull()
//         .unique()
//         .$defaultFn(() => {
//             return uuidv4()
//         }),
//     name: text("name")
//         .notNull(),
//     description: text("description"),
//     createdAt: text("created_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
//     updatedAt: text("updated_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
// })

// export type WatchList = typeof watchList.$inferSelect

// export const watchListSymbols = sqliteTable("watch_list_symbol", {
//     listId: text("list_id").references(() => watchList.listId),
//     symbol: text("symbol").references(() => symbols.symbolId),
// })

// export const wallet = sqliteTable("wallet", {
//     userId: text("user_id").references(() => users.id),
//     walletId: text("wallet_id")
//         .notNull()
//         .unique()
//         .$defaultFn(() => {
//             return uuidv4()
//         }),
//     name: text("name")
//         .notNull(),
//     description: text("description"),
//     createdAt: text("created_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
//     updatedAt: text("updated_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
// })

// export type Wallet = typeof wallet.$inferSelect

// export const walletSymbols = sqliteTable("wallet_symbol", {
//     transactionId: text("transaction_id")
//         .notNull()
//         .unique()
//         .$defaultFn(() => {
//             return uuidv4()
//         })
//         .primaryKey(),
//     walletId: text("wallet_id")
//         .notNull()
//         .references(() => wallet.walletId),
//     symbol: text("symbol")
//         .notNull(),
//     currency: text("currency")
//         .notNull(),
//     quantity: int("quantity")
//         .notNull()
//         .$default(() => 0),
//     buyPrice: int("buy_price"),
//     buyAt: text("buy_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
//     addedAt: text("added_at")
//         .notNull()
//         .$defaultFn(() => new Date().toISOString()),
//     soldAt: text("sold_at"),
// })

// export type WalletSymbol = typeof walletSymbols.$inferSelect
