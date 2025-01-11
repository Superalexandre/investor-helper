import bcrypt from "bcryptjs"
import Database from "better-sqlite3"
import { eq, or, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { usersSchema } from "../../../../db/schema/users"
import crypto from "node:crypto"
import { createUserSession } from "@/session.server"
import { updateUserPreferences } from "../../lib/userPreferences"
import { getTheme } from "../../lib/getTheme"
import getLanguage from "../../lib/getLanguage"
import logger from "../../../../log"
import i18next from "../../i18next.server"

export default async function login({
	request,
	emailOrUsername,
	password
}: { request: Request; emailOrUsername: string; password: string }) {
	const t = await i18next.getFixedT(request, "login")
	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const algorithm = "aes-256-cbc"
	const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
	const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

	const cipher = crypto.createCipheriv(algorithm, key, iv)


	// Decrypt the mail
	let encryptedEmail = cipher.update(emailOrUsername.toLowerCase(), "utf8", "hex")
	encryptedEmail += cipher.final("hex")

	const users = await db
		.select()
		.from(usersSchema)
		.where(
			or(
				eq(sql<string>`lower(${usersSchema.username})`, emailOrUsername.toLowerCase()),
				eq(usersSchema.email, encryptedEmail)
			)
		)

	if (!users || users.length === 0 || !users[0]) {
		return {
			success: false,
			error: true,
			errors: {
				emailOrUsername: {
					message: t("errors.invalidCredentials")
				},
				password: { message: t("errors.invalidCredentials") }
			},
			message: t("errors.invalidCredentials")
		}
	}

	const user = users[0]

	if (user.loggedWithGoogle) {
		return {
			success: false,
			error: true,
			errors: {
				emailOrUsername: {
					message: "You have logged in with Google. Please use the Google login."
				},
			},
			message: t("errors.invalidCredentials")
		}
	}

	const match = await bcrypt.compare(password, user.password as string)
	if (!match) {
		logger.info("Password incorrect")

		return {
			success: false,
			error: true,
			errors: {
				emailOrUsername: {
					message: t("errors.invalidCredentials")
				},
				password: { message: t("errors.invalidCredentials") }
			},
			message: t("errors.invalidCredentials")
		}
	}

	// Check if the url have a redirect parameter
	const url = new URL(request.url)
	const redirectUrl = url.searchParams.get("redirect")
	const redirectUrlString = redirectUrl ? redirectUrl : "/profile"

	const [theme, language] = await Promise.all([getTheme(request), getLanguage(request)])

	logger.success(`User ${user.username} logged in`)

	await updateUserPreferences({
		user,
		preferences: {
			theme: theme,
			language: language
		}
	})

	return createUserSession({
		request,
		token: user.token,
		redirectUrl: redirectUrlString
	})
}
