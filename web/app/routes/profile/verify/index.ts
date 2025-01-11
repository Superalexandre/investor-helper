import { type LoaderFunction, redirect } from "@remix-run/node"
import logger from "../../../../../log"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { verificationEmailSchema } from "../../../../../db/schema/email"
import { eq } from "drizzle-orm"
import { usersSchema } from "../../../../../db/schema/users"
import crypto from "node:crypto"
import { sendEmail } from "../../../../utils/email/email"

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	const token = url.searchParams.get("token")

	if (!token) {
		logger.warn("No token provided")

		return redirect("/profile")
	}

	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const emails = await db.select().from(verificationEmailSchema).where(eq(verificationEmailSchema.token, token))
	const email = emails[0]

	if (!emails || !email) {
		logger.warn("Token invalid")

		return redirect("/")
	}

	const algorithm = "aes-256-cbc"
	const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
	const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

	const decipher = crypto.createDecipheriv(algorithm, key, iv)

	let emailClear = decipher.update(email.email, "hex", "utf8")
	emailClear += decipher.final("utf8")

	try {
		// Update the user to be verified
		await db
			.update(usersSchema)
			.set({
				emailVerified: true
			})
			.where(eq(usersSchema.email, email.email))

		// Delete the token from the database
		await db.delete(verificationEmailSchema).where(eq(verificationEmailSchema.token, token))
	} catch (error) {
		console.log(error?.toString())

		logger.error(error?.toString() || "Error verifying email", {
			token,
			email
		})

		return redirect("/")
	}

	logger.success(`Email ${emailClear} verified`)

	// Send welcome message
	const subject = "Welcome to Investor Helper"
	const text = "Welcome to Investor Helper! You can now start using the app."

	// Send the email
	sendEmail(emailClear, subject, text)

	return redirect("/profile")
}
