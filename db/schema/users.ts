import { sqliteTable, text, int } from "drizzle-orm/sqlite-core"
// import { createId } from "@paralleldrive/cuid2"
import crypto from "node:crypto"
import { v4 as uuidv4 } from "uuid"
import { symbolsSchema } from "./symbols.js"

export const usersSchema = sqliteTable("user", {
	id: text("id")
		.primaryKey()
		.unique()
		.notNull()
		.$defaultFn(() => {
			return uuidv4()
		}),
	token: text("token")
		.unique()
		.notNull()
		.$defaultFn(() => {
			return crypto.randomBytes(32).toString("hex")
		}),
	username: text("username").notNull().unique(),
	displayName: text("display_name"),
	avatar: text("avatar"),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text("email").unique(),
	password: text("password").notNull(),
	salt: text("salt").notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.$defaultFn(() => new Date().toISOString())
		.notNull()
})

export type User = typeof usersSchema.$inferSelect

export const watchListSchema = sqliteTable("watch_list", {
	userId: text("user_id").references(() => usersSchema.id),
	listId: text("list_id")
		.notNull()
		.unique()
		.$defaultFn(() => {
			return uuidv4()
		}),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
})

export type WatchList = typeof watchListSchema.$inferSelect

export const watchListSymbolsSchema = sqliteTable("watch_list_symbol", {
	listId: text("list_id").references(() => watchListSchema.listId),
	symbol: text("symbol").references(() => symbolsSchema.symbolId)
})

export type WatchListSymbol = typeof watchListSymbolsSchema.$inferSelect

export const walletSchema = sqliteTable("wallet", {
	userId: text("user_id").references(() => usersSchema.id),
	walletId: text("wallet_id")
		.notNull()
		.unique()
		.$defaultFn(() => {
			return uuidv4()
		}),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
})

export type Wallet = typeof walletSchema.$inferSelect

export const walletSymbolsSchema = sqliteTable("wallet_symbol", {
	transactionId: text("transaction_id")
		.notNull()
		.unique()
		.$defaultFn(() => {
			return uuidv4()
		})
		.primaryKey(),
	walletId: text("wallet_id")
		.notNull()
		.references(() => walletSchema.walletId),
	symbol: text("symbol").notNull(),
	currency: text("currency").notNull(),
	quantity: int("quantity")
		.notNull()
		.$default(() => 0),
	buyPrice: int("buy_price"),
	buyAt: text("buy_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	addedAt: text("added_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	soldAt: text("sold_at")
})

export type WalletSymbol = typeof walletSymbolsSchema.$inferSelect
