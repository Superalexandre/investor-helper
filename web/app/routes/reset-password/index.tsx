import { LockKeyholeIcon, SquareAsteriskIcon } from "lucide-react";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { type ActionFunction, type LoaderFunction, redirect } from "@remix-run/node";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { resetPasswordEmailSchema } from "../../../../db/schema/password";
import { eq } from "drizzle-orm";
import { usersSchema } from "../../../../db/schema/users";
import crypto from "node:crypto";
import logger from "../../../../log";
import bcrypt from "bcryptjs"
import { cn } from "../../lib/utils";
import { z as zod } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { useRemixForm } from "remix-hook-form";
import InputForm, { type FieldErrors } from "../../components/form/inputForm";
import { useState } from "react";
import { ShowButtonComponent } from "../../components/button/showHideButton";
import { useTranslation } from "react-i18next";

const schema = zod.object({
    password: zod.string().min(8, "Password must be at least 8 characters").max(255, "Password must be at most 255 characters"),
    confirmPassword: zod.string().min(8, "Password must be at least 8 characters").max(255, "Password must be at most 255 characters")
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
})

type FormData = zod.infer<typeof schema>
const resolver = zodResolver(schema)

export const loader: LoaderFunction = async ({ request }) => {
    // Check if the user have a token in the URL and if it's valid
    // If it is, show the form to reset the password
    // If it isn't, redirect to the login page
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    if (!token) {
        return redirect("/login")
    }

    // Check if the token is valid
    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    const user = await db.select().from(resetPasswordEmailSchema).where(eq(resetPasswordEmailSchema.token, token))

    if (!user || user.length === 0) {
        return redirect("/login")
    }

    return {
        token
    }
}

export const action: ActionFunction = async ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    const body = new URLSearchParams(await request.text())
    const password = body.get("password")
    const confirmPassword = body.get("confirmPassword")

    if (!password || !confirmPassword || !token) {
        console.log({
            password,
            confirmPassword,
            token
        })

        return {
            success: false,
            message: "Missing fields"
        }
    }

    if (password !== confirmPassword) {
        logger.warn("Passwords don't match")

        return {
            success: false,
            message: "Passwords don't match"
        }
    }

    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    const user = await db.select().from(resetPasswordEmailSchema).where(eq(resetPasswordEmailSchema.token, token))

    if (!user || user.length === 0) {
        logger.warn("Invalid token")
        return {
            success: false,
            message: "Invalid token"
        }
    }

    const email = user[0].email

    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update the user's password
    const newUser = await db
        .update(usersSchema)
        .set({
            password: hashedPassword,
            salt: salt,
            // Generate a new token to invalidate the old one
            token: crypto.randomBytes(32).toString("hex")
        })
        .where(eq(usersSchema.email, email))
        .returning({ username: usersSchema.username })

    // Delete the token from the database
    await db.delete(resetPasswordEmailSchema).where(eq(resetPasswordEmailSchema.token, token))

    logger.success(`Password reset for ${newUser[0].username}`)

    // return redirect("/login")
    return {
        success: true,
        message: "Password reset"
    }
}

export const handle = {
    i18n: "resetPassword"
}

export default function Index() {
    const { t } = useTranslation("resetPassword")

    const { token } = useLoaderData<typeof loader>()
    const result = useActionData<typeof action>()

    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

    const {
        handleSubmit,
        formState: { errors, isSubmitting, isSubmitSuccessful },
        register
    } = useRemixForm<FormData>({
        mode: "onSubmit",
        submitConfig: {
            action: `/reset-password?token=${token}`,
            method: "POST"
        },
        resolver
    })
    return (
        <div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
            <Card className="size-full lg:size-1/2">
                <CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl dark:text-white">
                    <SquareAsteriskIcon className="size-8" />

                    Réinitialisation de mot de passe
                </CardTitle>
                <CardContent className="flex h-full w-full items-center justify-center">
                    <div className="w-11/12 lg:w-1/2">
                        <Form
                            method="post"
                            action={`/reset-password?token=${token}`}
                            className="flex size-full flex-col items-center justify-center gap-4"
                            onSubmit={handleSubmit}
                        >
                            <div className="w-full">
                                {/* <Label htmlFor="password">Nouveau mot de passe</Label>
                                <Input
                                    type="password"
                                    id="password"
                                    placeholder="Nouveau mot de passe"
                                    autoComplete="new-password"
                                    {...register("password")}
                                /> */}
                                <InputForm
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    placeholder="Nouveau mot de passe"
                                    autoComplete="new-password"
                                    errors={errors as FieldErrors}
                                    register={register}
                                    Icon={LockKeyholeIcon}
                                    ShowButton={<ShowButtonComponent show={showPassword} setShow={setShowPassword} />}
                                    t={t}
                                />
                            </div>
                            <div className="w-full">


                                <InputForm
                                    type={showPasswordConfirmation ? "text" : "password"}
                                    name="confirmPassword"
                                    id="confirmPassword"
                                    placeholder="Confirmer le nouveau mot de passe"
                                    autoComplete="new-password"
                                    errors={errors as FieldErrors}
                                    register={register}
                                    Icon={LockKeyholeIcon}
                                    ShowButton={<ShowButtonComponent show={showPasswordConfirmation} setShow={setShowPasswordConfirmation} />}
                                    t={t}
                                />
                            </div>

                            {result?.message ? (
                                <div className={cn("w-full", result.success ? "text-green-500" : "text-red-500")}>
                                    {result.message}
                                </div>
                            ) : null}

                            <Button type="submit" variant="default">
                                Réinitialiser
                            </Button>
                        </Form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}