import { Resend } from "resend"
import logger from "../../../log"
import crypto from "node:crypto"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { verificationEmailSchema } from "../../../db/schema/email"

const resend = new Resend(process.env.RESEND_API_KEY as string)

async function sendAccountActivationEmail(email: string) {
	// Create a token and store it in the database then send the email
	const token = crypto.randomBytes(32).toString("hex")

	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const algorithm = "aes-256-cbc"
	const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
	const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

	const cipher = crypto.createCipheriv(algorithm, key, iv)

	// Encrypt the mail
	let emailEncrypted = cipher.update(email, "utf8", "hex")
	emailEncrypted += cipher.final("hex")

	// Generate a four digit code
	const code = Math.floor(1000 + Math.random() * 9000).toString()

	try {
		await db.insert(verificationEmailSchema).values({
			email: emailEncrypted,
			token,
			code
		})
	} catch (error) {
		logger.error(error?.toString() || "Error inserting verification email", {
			error
		})

		return
	}

	const subject = "Activate your account"
	const text = `Click here to activate your account: ${process.env.CLIENT_URL}/profile/verify?token=${token}\n\nCode: ${code}`
	sendEmail(email, subject, text)
}

async function sendEmail(email: string, subject: string, text: string) {
	const { data, error } = await resend.emails.send({
		from: "Investor helper <account@mail.investor-helper.com>",
		to: email,
		subject,
		text: text
	})

	if (error) {
		return logger.error(error)
	}

	logger.success(`Email sent to ${email} (${data?.id})`)
}

export { sendAccountActivationEmail, sendEmail }
