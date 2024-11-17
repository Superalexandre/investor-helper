import bcrypt from "bcryptjs"
import Database from "better-sqlite3"
import { eq, or, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { usersSchema } from "../../../../db/schema/users"
import crypto from "node:crypto"
import { createUserSession } from "@/session.server"

export default async function login({
	request,
	emailOrUsername,
	password
}: { request: Request; emailOrUsername: string; password: string }) {
	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const algorithm = "aes-256-cbc"
	const key = crypto.randomBytes(32)
	const iv = crypto.randomBytes(16)

	const cipher = crypto.createCipheriv(algorithm, key, iv)

	// Decrypt the mail
	let encrypted = cipher.update(emailOrUsername.toLowerCase(), "utf8", "hex")
	encrypted += cipher.final("hex")

	const users = await db
		.select()
		.from(usersSchema)
		.where(
			or(
				eq(sql<string>`lower(${usersSchema.username})`, emailOrUsername.toLowerCase()),
				eq(usersSchema.email, encrypted)
			)
		)

	if (!users || users.length === 0 || !users[0]) {
		return {
			success: false,
			error: true,
			errors: {
				mailOrUsername: {
					message: "Nom d'utilisateur ou email introuvable"
				}
			},
			message: "Nom d'utilisateur ou email introuvable"
		}
	}

	const user = users[0]

	const match = await bcrypt.compare(password, user.password)
	if (!match) {
		console.log("Password incorrect")

		return {
			success: false,
			error: true,
			errors: {
				password: { message: "Mot de passe incorrect" }
			},
			message: "Mot de passe incorrect"
		}
	}
	
	// Check if the url have a redirect parameter
	const url = new URL(request.url)
	const redirectUrl = url.searchParams.get("redirect")
	const redirectUrlString = redirectUrl ? redirectUrl : "/"

	return createUserSession({
		request,
		token: user.token,
		redirectUrl: redirectUrlString
	})
}
