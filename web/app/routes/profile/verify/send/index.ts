import { type ActionFunction, redirect } from "react-router";
import { getUser } from "../../../../session.server"
import { sendAccountActivationEmail } from "../../../../../utils/email/email"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { verificationEmailSchema } from "../../../../../../db/schema/email"
import { eq } from "drizzle-orm"
import logger from "../../../../../../log"
import crypto from "node:crypto"

export const action: ActionFunction = async ({ request }) => {
	const user = await getUser(request)

	if (!user) {
		return redirect("/login?redirect=/profile")
	}

	if (user.emailVerified) {
		return redirect("/profile")
	}

	// Check if the email has already been sent
	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	// UnEncrypt the email
	const algorithm = "aes-256-cbc"
	const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
	const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

	const decipher = crypto.createDecipheriv(algorithm, key, iv)

    let emailClear = decipher.update(user.email, "hex", "utf8")
    emailClear += decipher.final("utf8")

	const emails = await db.select().from(verificationEmailSchema).where(eq(verificationEmailSchema.email, user.email))

	// If the email has already been sent but its more than 5 minutes ago, send a new one
	if (emails.length > 0) {
		const email = emails[0]

		const verificationCreatedAt = new Date(email.createdAt).getTime()
		const FIVE_MINUTES_IN_MS = 1000 * 60 * 5

		if (verificationCreatedAt + FIVE_MINUTES_IN_MS < Date.now()) {
			await db.delete(verificationEmailSchema).where(eq(verificationEmailSchema.email, user.email))
		} else {
			logger.warn(`Email already sent to ${emailClear}`)

			return redirect("/profile")
		}
	} else {
		logger.warn(`No verification email found for ${emailClear}`)
	}

	// Send the email
	sendAccountActivationEmail(emailClear)

	return redirect("/profile")
}
