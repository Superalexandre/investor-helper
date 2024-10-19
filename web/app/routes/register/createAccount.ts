import crypto from "node:crypto"

import { json } from "@remix-run/node"
import bcrypt from "bcryptjs"
import Database from "better-sqlite3"
import { eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { usersSchema } from "@/schema/users"
import { createUserSession } from "../../session.server"

interface FormData {
	request: Request
	name: string
	firstName: string
	username: string
	email: string
	password: string
	passwordConfirmation: string
}

const uniqueRegex = /UNIQUE constraint failed: accounts\.(\w+)/

export default async function createAccount({ request, name, firstName, username, email, password }: FormData) {
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
				message: "Un utilisateur possède deja cette adresse mail"
			}
		}

		if (usernameExists.length > 0) {
			errors.username = {
				message: "Un utilisateur possède deja ce nom d'utilisateur"
			}
		}

		return json(
			{
				success: false,
				error: true,
				errors,
				message: "Une erreur est survenue lors de la création du compte !"
			},
			{ status: 500 }
		)
	}

	try {
		const newUser = await db
			.insert(usersSchema)
			.values({
				firstName: firstName,
				lastName: name,
				username: lowerUsername,
				displayName: username,
				password: hashedPassword,
				salt: salt,
				email: mailEncrypted
			})
			.returning({
				token: usersSchema.token
			})

		// Check if the url have a redirect parameter
		const url = new URL(request.url)
		const redirectUrl = url.searchParams.get("redirect")

		const redirectUrlString = redirectUrl ? redirectUrl : "/profile"

		return createUserSession({
			request,
			token: newUser[0].token,
			redirectUrl: redirectUrlString
		})
	} catch (error) {
		const defaultError = json(
			{
				success: false,
				error: true,
				errors: {
					root: {
						message: "Une erreur est survenue lors de la création du compte !"
					}
				},
				message: "Une erreur est survenue lors de la création du compte !"
			},
			{ status: 500 }
		)

		if (!(error instanceof Error)) {
			return defaultError
		}

		const match = error.message.match(uniqueRegex)
		if (!match) {
			return defaultError
		}

		return json(
			{
				success: false,
				error: true,
				errors: {
					// mail: { message: "Une erreur est survenue lors de la création du compte !" },
					[match[1]]: {
						message: `Un utilisateur possède deja ce ${match[1]}`
					}
				},
				message: "Une erreur est survenue lors de la création du compte !"
			},
			{ status: 500 }
		)
	}
}
