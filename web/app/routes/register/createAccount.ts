import crypto from "node:crypto"

import bcrypt from "bcryptjs"
import Database from "better-sqlite3"
import { eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { usersSchema } from "@/schema/users"
import { createUserSession } from "../../session.server"
import i18next from "../../i18next.server"
import logger from "../../../../log"

interface FormData {
	request: Request
	name: string
	firstName: string
	username: string
	email: string
	password: string
	passwordConfirmation: string
	terms: boolean
}

export default async function createAccount({
	request,
	name,
	firstName,
	username,
	email,
	password,
	passwordConfirmation,
	terms
}: FormData) {
	const t = await i18next.getFixedT(request, "register")

	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const saltRounds = 10
	const salt = await bcrypt.genSalt(saltRounds)
	const hashedPassword = await bcrypt.hash(password, salt)

	const algorithm = "aes-256-cbc"
	const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
	const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

	const cipher = crypto.createCipheriv(algorithm, key, iv)

	// Encrypt the mail
	let mailEncrypted = cipher.update(email, "utf8", "hex")
	mailEncrypted += cipher.final("hex")

	// Find if the mail or username already exists
	const mailExists = await db
		.select()
		.from(usersSchema)
		.where(eq(sql<string>`lower(${usersSchema.email})`, mailEncrypted))

	const lowerUsername = username.toLowerCase()
	const usernameExists = await db
		.select()
		.from(usersSchema)
		.where(eq(sql<string>`lower(${usersSchema.username})`, lowerUsername))

	if (mailExists.length > 0 || usernameExists.length > 0) {
		const errors: { [key: string]: { message: string } } = {}

		if (mailExists.length > 0) {
			errors.email = {
				message: t("errors.emailExists")
			}
		}

		if (usernameExists.length > 0) {
			errors.username = {
				message: t("errors.usernameExists")
			}
		}

		return {
			success: false,
			error: true,
			errors,
			message: t("errors.errorOccured")
		}
	}

	if (password !== passwordConfirmation) {
		return {
			success: false,
			error: true,
			errors: {
				password: {
					message: t("errors.confirmPassword")
				},
				passwordConfirmation: {
					message: t("errors.confirmPassword")
				}
			},
			message: t("errors.errorOccured")
		}
	}

	if (!terms) {
		return {
			success: false,
			error: true,
			errors: {
				terms: {
					message: t("errors.terms")
				}
			},
			message: t("errors.errorOccured")
		}
	}

	try {
		// Insertion du nouvel utilisateur
		const newUser = await db
			.insert(usersSchema)
			.values({
				firstName: firstName.trim(),
				lastName: name.trim(),
				username: lowerUsername,
				displayName: username,
				password: hashedPassword,
				salt: salt,
				email: mailEncrypted
			})
			.returning({ token: usersSchema.token })

		// Redirection
		const url = new URL(request.url)
		const redirectUrl = url.searchParams.get("redirect") || "/profile"

		return createUserSession({
			request,
			token: newUser[0].token,
			redirectUrl
		})
	} catch (error) {
		logger.error("Erreur lors de la création du compte :", { error })

		return {
			success: false,
			error: true,
			errors: {
				root: {
					message: t("errors.errorOccured")
				}
			},
			message: t("errors.errorOccured")
		}
	}
}
