import { type ActionFunction, type LoaderFunction, type MetaFunction, redirect } from "@remix-run/node"
import logger from "../../../../../log"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { verificationEmailSchema } from "../../../../../db/schema/email"
import { eq } from "drizzle-orm"
import { usersSchema } from "../../../../../db/schema/users"
import crypto from "node:crypto"
import { sendEmail } from "../../../../utils/email/email"
import { Card, CardContent, CardTitle } from "../../../components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../../components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { getValidatedFormData, useRemixForm } from "remix-hook-form"
import { Form, useLoaderData } from "@remix-run/react"
import { z as zod } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import i18next from "../../../i18next.server"
import { useTranslation } from "react-i18next"

const schema = zod.object({
	code: zod.string({
		required_error: "errors.codeRequired"
	}).length(4, "errors.codeLength").regex(/^\d+$/, "errors.codeInvalid"),
})

type FormData = zod.infer<typeof schema>
const resolver = zodResolver(schema)

export const loader: LoaderFunction = async ({ request }) => {
	const t = await i18next.getFixedT(request, "verify")
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

	const title = t("title")
	const description = t("description")

	return {
		token,
		title,
		description
	}
}

export const action: ActionFunction = async ({ request }) => {
	const t = await i18next.getFixedT(request, "verify")
	const url = new URL(request.url)
	const token = url.searchParams.get("token")
	const { errors, data } = await getValidatedFormData<FormData>(request, resolver)

	if (errors) {
		return { errors }
	}

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

	if (data.code !== email.code) {
		logger.warn("Code invalid")

		return {
			errors: {
				code: {
					message: t("errors.codeInvalid")
				}
			}
		}
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return []
	}

	const { title, description } = data

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/verify" }
	]
}

export const handle = {
	i18n: "verify"
}

export default function Index() {
	const { t} = useTranslation("verify")
	const { token } = useLoaderData<typeof loader>()

	const {
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		trigger
	} = useRemixForm<FormData>({
		mode: "onSubmit",
		submitConfig: {
			action: `/profile/verify?token=${token}`,
			method: "POST"
		},
		resolver
	})

	return (
		<div className="flex h-screen w-full flex-1 flex-col items-center justify-center p-4">
			<Card className="size-full lg:size-1/2">
				<CardTitle className="flex flex-row items-center justify-center gap-2 p-4 text-center font-bold text-3xl text-white">
					{t("verify")}
				</CardTitle>
				<CardContent className="flex h-full w-full items-center justify-center">
					<Form
						action={`/profile/verify?token=${token}`}
						method="POST"
						className="flex w-11/12 flex-col items-center justify-center gap-4 lg:w-1/2"
						onSubmit={handleSubmit}
					>
						<Label>
							{t("enterCode")}
						</Label>

						<InputOTP
							maxLength={4}
							pattern={REGEXP_ONLY_DIGITS}
							onComplete={(): void => {
								trigger("code")
								handleSubmit()
							}}
							onChange={(value): void => {
								trigger("code")
								setValue("code", value)
							}}
							autoFocus={true}
						>
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
								<InputOTPSlot index={3} />
							</InputOTPGroup>
						</InputOTP>

						{errors?.code?.message ? (
							<p className="text-red-500 text-sm">{t(errors.code.message)}</p>
						) : null}

						<Button type="submit" disabled={isSubmitting}>
							{t("verify")}
						</Button>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}