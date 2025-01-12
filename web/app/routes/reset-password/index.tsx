import { LockKeyholeIcon, SquareAsteriskIcon } from "lucide-react";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Button } from "../../components/ui/button";
import { type ActionFunction, type LoaderFunction, type MetaFunction, redirect } from "@remix-run/node";
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
import { getValidatedFormData, useRemixForm } from "remix-hook-form";
import InputForm, { type FieldErrors } from "../../components/form/inputForm";
import { useState } from "react";
import { ShowButtonComponent } from "../../components/button/showHideButton";
import { useTranslation } from "react-i18next";
import i18next from "../../i18next.server";

const schema = zod.object({
    password: zod.string().min(8, "errors.passwordMinLength").max(255, "errors.passwordMaxLength"),
    confirmPassword: zod.string().min(8, "errors.passwordMinLength").max(255, "errors.passwordMaxLength")
}).refine(data => data.password === data.confirmPassword, {
    message: "errors.confirmPassword",
    path: ["confirmPassword"]
})

type FormData = zod.infer<typeof schema>
const resolver = zodResolver(schema)

export const loader: LoaderFunction = async ({ request }) => {
    // Check if the user have a token in the URL and if it's valid
    // If it is, show the form to reset the password
    // If it isn't, redirect to the login page
    const t = await i18next.getFixedT(request, "resetPassword")

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

    const title = t("title")
    const description = t("description")

    return {
        token,
        title,
        description
    }
}

export const action: ActionFunction = async ({ request }) => {
    const t = await i18next.getFixedT(request, "resetPassword")
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    // const body = new URLSearchParams(await request.text())
    // const password = body.get("password")
    // const confirmPassword = body.get("confirmPassword")
    const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver)

    if (errors) {
        return { errors, defaultValues }
    }

    if (!token) {
        return redirect("/login")
    }

    const password = data.password
    const confirmPassword = data.confirmPassword

    if (password !== confirmPassword) {
        logger.warn("Passwords don't match")

        return {
            errors: {
                confirmPassword: {
                    message: t("errors.passwordsDontMatch")
                }
            }
        }
    }

    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    const user = await db.select().from(resetPasswordEmailSchema).where(eq(resetPasswordEmailSchema.token, token))

    if (!user || user.length === 0) {
        logger.warn("Invalid token")

        return {
            errors: {
                password: {
                    message: "Invalid token"
                }
            }
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
        { tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/reset-password" }
    ]
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
        formState: { errors },
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

                    {t("resetPassword")}
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
                                <InputForm
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    placeholder={t("newPassword")}
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
                                    placeholder={t("confirmNewPassword")}
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
                                {t("reset")}
                            </Button>
                        </Form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}