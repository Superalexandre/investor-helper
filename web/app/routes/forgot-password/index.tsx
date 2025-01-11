import { Form, useActionData } from "@remix-run/react";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { type ActionFunction, redirect } from "@remix-run/node";
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

export const action: ActionFunction = async ({ request }) => {
    const body = new URLSearchParams(await request.text())
    const email = body.get("email")

    if (!email) {
        return {
            success: false,
            message: "Missing email"
        }
    }

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
            success: false,
            message: "Email not found"
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
            return {
                success: false,
                message: `Email already sent please wait ${formatDistance(new Date(createdAt.getTime() + FIVE_MINUTES_IN_MS), new Date(), { includeSeconds: true })}`,
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
                success: false,
                message: "Unknown error"
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
            success: false,
            message: "Unknown error"
        }
    }

    // Send the email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`

    const subject = "Réinitialisation de votre mot de passe"
    const text = `Cliquez sur le lien suivant pour réinitialiser votre mot de passe: ${resetUrl}`

    sendEmail(email, subject, text)

    return {
        success: true,
        message: "Email sent"
    }
}

export default function Index() {
    const result = useActionData<typeof action>()

    return (
        <div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
            <Card className="size-full lg:size-1/2">
                <CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl dark:text-white">
                    <SquareAsteriskIcon className="size-8" />

                    Mot de passe oublié
                </CardTitle>
                <CardContent className="flex h-full w-full items-center justify-center">
                    <div className="w-11/12 lg:w-1/2">
                        <Form method="post" action="/forgot-password" className="flex size-full flex-col items-center justify-center gap-4">
                            <Label htmlFor="email">Email de votre compte</Label>
                            <Input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="Email"
                                autoComplete="email"
                            />

                            {result?.message ? (
                                <div className={cn("w-full", result.success ? "text-green-500" : "text-red-500")}>
                                    {result.message}
                                </div>
                            ) : null}

                            <Button type="submit" variant="default">
                                Envoyer
                            </Button>
                        </Form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}