import { Form, useActionData } from "react-router";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import type { ActionFunction, LoaderFunction, MetaFunction } from "react-router";
import { SquareAsteriskIcon } from "lucide-react";
import crypto from "node:crypto"
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { usersSchema } from "../../../../db/schema/users";
import { eq } from "drizzle-orm";
import { resetPasswordEmailSchema } from "../../../../db/schema/password"
import logger from "../../../../log";
import { sendEmail } from "../../../utils/email/email";
import { cn } from "../../lib/utils";
import { formatDistance } from "date-fns";
import { useTranslation } from "react-i18next";
import i18next from "../../i18next.server";
import { dateFns } from "../../i18n";
import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getValidatedFormData, useRemixForm } from "remix-hook-form";

const schema = zod.object({
    email: zod.string({
        required_error: "errors.requiredEmail"
    }).email("errors.invalidEmail")

})

type FormData = zod.infer<typeof schema>
const resolver = zodResolver(schema)

export const loader: LoaderFunction = async ({ request }) => {
    const [t] = await Promise.all([
        i18next.getFixedT(request, "forgotPassword")
    ])

    return {
        title: t("title"),
        description: t("description")
    }
}

export const action: ActionFunction = async ({ request }) => {
    const [t, language] = await Promise.all([
        i18next.getFixedT(request, "forgotPassword"),
        i18next.getLocale(request)
    ])

    const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver)

    if (errors) {
        return { errors, defaultValues }
    }

    const email = data.email

    // Check if the email exists in the database
    // If it does, send an email with a token to reset the password
    // If it doesn't, return an error message
    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    const algorithm = "aes-256-cbc"
    const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
    const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

    const cipher = crypto.createCipheriv(algorithm, key, iv)

    let encryptedEmail = cipher.update(email, "utf8", "hex")
    encryptedEmail += cipher.final("hex")

    const user = await db.select().from(usersSchema).where(eq(usersSchema.email, encryptedEmail))

    if (!user || user.length === 0) {
        return {
            errors: {
                email: {
                    message: t("emailNotFound")
                }
            }
        }
    }

    // Check if the user has already requested a password reset
    const tokens = await db.select().from(resetPasswordEmailSchema).where(eq(resetPasswordEmailSchema.email, encryptedEmail))

    if (tokens.length > 0) {
        // Check if the token is still valid
        const token = tokens[0]
        const createdAt = new Date(token.createdAt)
        const now = new Date()

        const diff = now.getTime() - createdAt.getTime()

        const FIVE_MINUTES_IN_MS = 5 * 60 * 1000

        if (diff < FIVE_MINUTES_IN_MS) {
            const distance = formatDistance(new Date(createdAt.getTime() + FIVE_MINUTES_IN_MS), now, { includeSeconds: true, locale: dateFns[language] })

            return {
                errors: {
                    email: {
                        message: `${t("alreadySent")} ${distance}`
                    }
                }
            }
        }

        // Delete the token from the database
        try {
            logger.info(`${email} requested a new password reset token`)

            await db.delete(resetPasswordEmailSchema).where(eq(resetPasswordEmailSchema.email, encryptedEmail))
        } catch (error) {
            logger.error(error?.toString() || "Error deleting token from database", {
                email
            })

            return {
                errors: {
                    email: {
                        message: "Unknown error"
                    }
                }
            }
        }
    }

    // Generate a token
    const token = crypto.randomBytes(32).toString("hex")

    // Save the token in the database
    try {
        await db.insert(resetPasswordEmailSchema).values({
            email: encryptedEmail,
            token
        })
    } catch (error) {
        logger.error(error?.toString() || "Error saving token to database", {
            email,
            token
        })

        return {
            errors: {
                email: {
                    message: "Unknown error"
                }
            }
        }
    }

    // Send the email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`

    const subject = "Réinitialisation de votre mot de passe"
    const text = `Cliquez sur le lien suivant pour réinitialiser votre mot de passe: ${resetUrl}`

    sendEmail(email, subject, text)

    return {
        success: true,
        message: t("success")
    }
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
        { tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/register" }
    ]
}

export const handle = {
    i18n: "forgotPassword",
}

export default function Index() {
    const { t } = useTranslation("forgotPassword")
    const result = useActionData<typeof action>()

    const {
        handleSubmit,
        formState: { errors, isSubmitting, isSubmitSuccessful },
        register
    } = useRemixForm<FormData>({
        mode: "onSubmit",
        submitConfig: {
            action: "/forgot-password",
            method: "POST"
        },
        resolver
    })

    return (
        <div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
            <Card className="size-full lg:size-1/2">
                <CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl dark:text-white">
                    <SquareAsteriskIcon className="size-8" />

                    {t("forgotPassword")}
                </CardTitle>
                <CardContent className="flex h-full w-full items-center justify-center">
                    <div className="w-11/12 lg:w-1/2">
                        <Form method="post" action="/forgot-password" className="flex size-full flex-col items-center justify-center gap-4" onSubmit={handleSubmit}>
                            <Label htmlFor="email">{t("emailAccount")}</Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder={t("email")}
                                autoComplete="email"
                                {...register("email")}
                            />

                            {errors?.email?.message ? (
                                <span className={cn("w-full text-center text-red-500 text-sm lg:text-left")}>
                                    {t(errors.email?.message?.toString())}
                                </span>
                            ) : null}

                            {result?.message ? (
                                <span className={cn("w-full text-center text-green-500 text-sm lg:text-left")}>
                                    {result.message}
                                </span>
                            ) : null}
                            
                            <Button type="submit" variant="default">
                                {t("send")}
                            </Button>
                        </Form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}