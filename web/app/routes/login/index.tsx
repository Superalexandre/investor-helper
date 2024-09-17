import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, Link, redirect, useSearchParams } from "@remix-run/react"
import { HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute, useState } from "react"
import { IconType } from "react-icons/lib"
import { MdLogin, MdMail, MdPassword, MdVisibility, MdVisibilityOff } from "react-icons/md"
import { getValidatedFormData, useRemixForm } from "remix-hook-form"
import * as zod from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import login from "./login"
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Button } from "@/components/ui/button"
import { getUser } from "@/session.server"

const schema = zod.object({
    mailOrUsername: zod
        .string()
        .trim()
        .min(3)
        .max(255),
    password: zod
        .string({
            coerce: true
        })
        .min(8)
        .max(255),
})
type FormData = zod.infer<typeof schema>

const resolver = zodResolver(schema)

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request)

    if (user) return redirect("/profile")

    return null
}

export async function action({ request }: ActionFunctionArgs) {
    const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver)

    if (errors) return json({ errors, defaultValues })

    const result = await login({ request, ...data })

    return result
}

export const meta: MetaFunction = () => {
    return [
        { title: "Investor Helper - Connexion" },
        // { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const [showPassword, setShowPassword] = useState(false)
    const [params,] = useSearchParams()

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        register,
    } = useRemixForm<FormData>({
        mode: "onSubmit",
        resolver,
    })

    return (
        <div className="flex h-screen w-screen flex-1 flex-col items-center justify-center">
            <Card className="size-1/2">
                <CardTitle className="flex flex-row items-center justify-center gap-2 pb-8 pt-4 text-center text-3xl font-bold text-white">
                    <MdLogin size={30} />

                    Connexion
                </CardTitle>
                <CardContent className="h-full">
                    <Form
                        action="/login"
                        method="post"
                        onSubmit={handleSubmit}
                        className="flex size-full flex-col items-center justify-center gap-4"
                    >
                        <InputForm
                            type="text"
                            name="mailOrUsername"
                            id="mailOrUsername"
                            placeholder={"Nom d'utilisateur ou email"}
                            autoComplete="username email"
                            errors={errors as FieldErrors}
                            register={register}
                            Icon={MdMail}
                        />

                        <InputForm
                            type={showPassword ? "text" : "password"}
                            name="password"
                            id="password"
                            placeholder={"Mot de passe"}
                            autoComplete="current-password"
                            errors={errors as FieldErrors}
                            register={register}
                            Icon={MdPassword}
                            ShowButton={<ShowButtonComponent show={showPassword} setShow={setShowPassword} />}
                        />

                        <Link
                            to={{
                                pathname: "/register",
                                search: params.get("redirect") ? `?redirect=${params.get("redirect")}` : ""
                            }}
                            className="text-center text-white underline hover:text-slate-400"
                        >
                            Pas encore inscrit ? Créez un compte
                        </Link>
                        {/* <Link to="/account/forgot-password" className="text-white underline hover:text-slate-400 text-center">Mot de passe oublié ?</Link> */}

                        <Button
                            variant="default"
                            type="submit"
                            className={`${isSubmitting ? "opacity-50" : "hover:bg-green-700"} flex flex-row items-center justify-center gap-2 rounded bg-green-500 p-4 text-white`}
                            disabled={isSubmitting}
                        >
                            <MdLogin size={20} className={`${isSubmitting ? "hidden" : "block"}`} />
                            <div className={`${isSubmitting ? "block" : "hidden"} loader size-5`}></div>

                            Se connecter
                        </Button>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

function ShowButtonComponent({ show, setShow }: { show: boolean, setShow: (show: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute inset-y-0 right-0 mr-3 text-white hover:text-slate-400"
            aria-label="Afficher le mot de passe"
        >
            <MdVisibility size={20} className={`${show ? "hidden" : "block"}`} />
            <MdVisibilityOff size={20} className={`${show ? "block" : "hidden"}`} />
        </button>
    )
}


interface FieldErrors {
    [key: string]: {
        message: string
    }
}

interface InputFormProps {
    parentClass?: string
    errorClass?: string
    type: HTMLInputTypeAttribute
    placeholder?: string | undefined
    autoComplete?: HTMLInputAutoCompleteAttribute | undefined
    className?: string | undefined
    id?: string | undefined
    name?: string | undefined
    Icon?: IconType
    errors?: FieldErrors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register?: any
    ShowButton?: JSX.Element
}

function InputForm({ parentClass, errorClass, type = "text", placeholder, autoComplete, className, id, name, Icon, errors, register, ShowButton }: InputFormProps) {
    return (
        <div className={`flex w-11/12 flex-col items-start justify-center lg:w-1/2 ${parentClass}`}>
            <label htmlFor={name} className="flex flex-row items-center justify-center gap-2 text-white">
                {Icon ? <Icon size={20} /> : null}

                {placeholder}
            </label>

            <div className="relative w-full">
                <Input
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={className}
                    id={id}
                    name={name}
                    {...register(name)}
                />

                {ShowButton}
            </div>

            {errors && name && errors[name] ?
                <span className={`w-full text-center text-red-500 lg:text-left ${errorClass}`}>
                    {errors[name]?.message?.toString()}
                </span>
                : null}
        </div>
    )
}