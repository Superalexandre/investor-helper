import { GoogleStrategy } from "remix-auth-google"
import { Authenticator } from "remix-auth"
import { createUserSession, getSession, sessionStorage } from "./session.server"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import crypto from "node:crypto"
import { usersSchema } from "../../db/schema/users"
import { eq, or } from "drizzle-orm"
import { redirect } from "react-router";
import logger from "../../log"
import getLanguage from "./lib/getLanguage"
import { getTheme } from "./lib/getTheme"
import { updateUserPreferences } from "./lib/userPreferences"

export const authenticator = new Authenticator(sessionStorage)

const googleStrategy = new GoogleStrategy(
	{
		// biome-ignore lint/style/useNamingConvention: <explanation>
		clientID: process.env.GOOGLE_CLIENT_ID || "",
		clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		// biome-ignore lint/style/useNamingConvention: <explanation>
		callbackURL: process.env.GOOGLE_CALLBACK_URL || ""
	},
	async ({ accessToken, refreshToken, extraParams, profile, request, context }) => {
		console.log({
			accessToken,
			refreshToken,
			extraParams,
			profile,
			context
		})

		let redirectUrl = "/profile"

		const session = await getSession(request)
		const sessionRedirect = session.get("redirect")

		console.log(session.data)

		if (sessionRedirect) {
			redirectUrl = sessionRedirect

			session.unset("redirect")
		}

		console.log(`Redirecting to ${redirectUrl}`)

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

		// console.log(`Encrypted email: ${encryptedEmail} for ${googleEmail}`)

		const users = await db
			.select()
			.from(usersSchema)
			.where(or(eq(usersSchema.email, encryptedEmail)))

		if (users && users.length > 0) {
			const user = users[0]
			const [theme, language] = await Promise.all([getTheme(request), getLanguage(request)])

			logger.success(`User ${user.username} logged in with Google`)

			await updateUserPreferences({
				user,
				preferences: {
					theme: theme,
					language: language
				}
			})

			// Login the user
			return createUserSession({
				request,
				token: user.token,
				redirectUrl: redirectUrl
			})
		}

		// Create the user
		logger.info(`User with email ${googleEmail} not found, creating a new user`)


		const name = profile.name.familyName
		const firstName = profile.name.givenName

		let username = sanitizeUsername(profile.displayName)
		let usernameLower = username.toLowerCase()

		// Find a username that does not exist
		const usersUsername = await db.select().from(usersSchema).where(eq(usersSchema.username, username))

		if (usersUsername && usersUsername.length > 0) {
			const newUsername = await findUsername(username, usernameLower)

			if (!newUsername) {
				logger.error(`Could not find a new username for ${username}`)

				return null
			}

			username = newUsername.username
			usernameLower = newUsername.usernameLower
		}

		try {
			const newUser = await db
				.insert(usersSchema)
				.values({
					firstName: firstName.trim(),
					lastName: name.trim(),
					username: usernameLower,
					displayName: username,
					// password: hashedPassword,
					// salt: salt,
					email: encryptedEmail,
					emailVerified: true,
					loggedWithGoogle: true
				})
				.returning({ token: usersSchema.token })

			// Redirection

			return createUserSession({
				request,
				token: newUser[0].token,
				redirectUrl: redirectUrl
			})
		} catch (error) {
			logger.error(`Error creating user: ${error}`, error)

			return redirect("/")
		}
	}
)

function sanitizeUsername(username: string): string {
	const usernameSanitized = username
		.replace(" ", "_")

	return usernameSanitized
}

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
