import { GoogleStrategy } from "remix-auth-google"
import { Authenticator } from "remix-auth"
import { createUserSession, sessionStorage } from "./session.server"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import crypto from "node:crypto"
import { usersSchema } from "../../db/schema/users"
import { eq, or } from "drizzle-orm"
import { redirect } from "@remix-run/node"
import logger from "../../log"

export const authenticator = new Authenticator(sessionStorage)

const googleStrategy = new GoogleStrategy(
	{
		// biome-ignore lint/style/useNamingConvention: <explanation>
		clientID: process.env.GOOGLE_CLIENT_ID || "",
		clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		// biome-ignore lint/style/useNamingConvention: <explanation>
		callbackURL: process.env.GOOGLE_CALLBACK_URL || ""
	},
	async ({ accessToken, refreshToken, extraParams, profile, request }) => {
		console.log({
			accessToken,
			refreshToken,
			extraParams,
			profile
		})

		// Check if the profile._json.email is in the database
		// If it is, return the user
		// If it is not, create a new user and return it
		const url = new URL(request.url)
		const redirectUrl = url.searchParams.get("redirect") || "/profile"

		const googleEmail = profile._json.email
		const googleVerifiedEmail = profile._json.email_verified

		if (!googleEmail || !googleVerifiedEmail) {
			logger.warn(`Google email ${googleEmail} is not verified`)

			return redirect("/")
		}

		const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
		const db = drizzle(sqlite)

		const algorithm = "aes-256-cbc"
		const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
		const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

		const cipher = crypto.createCipheriv(algorithm, key, iv)

		// Decrypt the mail
		let encryptedEmail = cipher.update(googleEmail.toLowerCase(), "utf8", "hex")
		encryptedEmail += cipher.final("hex")

		console.log(`Encrypted email: ${encryptedEmail} for ${googleEmail}`)

		const users = await db
			.select()
			.from(usersSchema)
			.where(or(eq(usersSchema.email, encryptedEmail)))

		if (users && users.length > 0) {
			const user = users[0]

			logger.success(`User ${user.username} logged in with Google`)

			// Login the user
			return createUserSession({
				request,
				token: user.token,
				redirectUrl: redirectUrl
			})
		}

		// Create the user
		logger.info(`User with email ${googleEmail} not found, creating a new user`)

		/*
		try {


			const newUser = await db
				.insert(usersSchema)
				.values({
					firstName: firstName.trim(),
					lastName: name.trim(),
					username: lowerUsername,
					displayName: username,
					// password: hashedPassword,
					// salt: salt,
					email: mailEncrypted
				})
				.returning({ token: usersSchema.token })

			// Redirection
			const url = new URL(request.url)
			const redirectUrl = url.searchParams.get("redirect") || "/profile"

			return createUserSession({
				request,
				token: newUser[0].token,
				redirectUrl: redirectUrl
			})
		} catch (error) {
			logger.error(`Error creating user: ${error}`, error)

			return redirect("/")
		}
        */
	}
)

async function findUsername(
	username: string,
	usernameLower: string,
	iteration = 0
): Promise<{
	username: string
	usernameLower: string
} | null> {
	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	if (iteration > 10) {
		return null
	}

	// Add 4 random numbers to the username
	const random = Math.floor(Math.random() * 10000)

	const newUsernameLower = `${usernameLower}${random}`
	const newUsername = `${username}${random}`

	const users = await db.select().from(usersSchema).where(eq(usersSchema.username, username))

	if (users && users.length > 0) {
		return findUsername(username, usernameLower, iteration + 1)
	}

	logger.info(`Username ${username} found after ${iteration} iterations`)

	return {
		username: newUsername,
		usernameLower: newUsernameLower
	}
}

authenticator.use(googleStrategy)
