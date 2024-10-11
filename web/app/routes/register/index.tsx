import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, Link, redirect, useSearchParams } from "@remix-run/react"
import { type HTMLInputAutoCompleteAttribute, type HTMLInputTypeAttribute, useState } from "react"
import type { IconType } from "react-icons/lib"
import { MdAdd, MdBadge, MdEmail, MdPassword, MdVisibility, MdVisibilityOff } from "react-icons/md"
import { getValidatedFormData, useRemixForm } from "remix-hook-form"
// biome-ignore lint/style/noNamespaceImport: Zod is a namespace
import * as zod from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { JSX } from "react"

// import login from "./login"
import { type ActionFunctionArgs, json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { Button } from "@/components/ui/button"
import { getUser } from "@/session.server"
import createAccount from "./createAccount"

const schema = zod.object({
	name: zod.string().min(3).max(32).trim(),
	firstName: zod.string().min(3).max(32).trim(),
	username: zod
		.string()
		.min(3)
		.max(32)
		.trim()
		.regex(/^[a-zA-Z0-9_]+$/),
	email: zod.string().email().trim().toLowerCase(),
	password: zod.string().min(8).max(255),
	passwordConfirmation: zod.string().min(8).max(255)
})

type FormData = zod.infer<typeof schema>

const resolver = zodResolver(schema)

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (user) {
		return redirect("/profile")
	}

	return null
}

export async function action({ request }: ActionFunctionArgs) {
	const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver)

	if (errors) {
		return json({ errors, defaultValues })
	}

	const result = await createAccount({ request, ...data })

	return result
}

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Créer un compte"
	const description =
		"Créez un compte sur Investor Helper pour accéder à des fonctionnalités exclusives. Suivez vos investissements, vos actions et vos cryptomonnaies préférées. Restez informé des dernières actualités financières et économiques."

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://investor-helper.com/register" }
	]
}

export default function Index() {
	const [showPassword, setShowPassword] = useState(false)
	const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
	const [params] = useSearchParams()

	const {
		handleSubmit,
		formState: { errors, isSubmitting },
		register
	} = useRemixForm<FormData>({
		mode: "onSubmit",
		resolver
	})

	return (
		<div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
			<Card className="size-full lg:size-1/2">
				<CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl text-white">
					<MdAdd size={30} />
					Créer un compte
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
							name="name"
							id="name"
							placeholder="Nom"
							autoComplete="name"
							errors={errors as FieldErrors}
							register={register}
							Icon={MdBadge}
						/>

						<InputForm
							type="text"
							name="firstName"
							id="firstName"
							placeholder="Prénom"
							autoComplete="given-name"
							errors={errors as FieldErrors}
							register={register}
							Icon={MdBadge}
						/>

						<InputForm
							type="text"
							name="username"
							id="username"
							placeholder="Nom d'utilisateur"
							autoComplete="username"
							errors={errors as FieldErrors}
							register={register}
							Icon={MdBadge}
						/>

						<InputForm
							type="email"
							name="email"
							id="email"
							placeholder="Email"
							autoComplete="email"
							errors={errors as FieldErrors}
							register={register}
							Icon={MdEmail}
						/>

						<InputForm
							type={showPassword ? "text" : "password"}
							name="password"
							id="password"
							placeholder="Mot de passe"
							autoComplete="new-password"
							errors={errors as FieldErrors}
							register={register}
							Icon={MdPassword}
							ShowButton={<ShowButtonComponent show={showPassword} setShow={setShowPassword} />}
						/>

						<InputForm
							type={showPasswordConfirmation ? "text" : "password"}
							name="passwordConfirmation"
							id="passwordConfirmation"
							placeholder="Confirmer le mot de passe"
							autoComplete="new-password"
							errors={errors as FieldErrors}
							register={register}
							Icon={MdPassword}
							ShowButton={
								<ShowButtonComponent
									show={showPasswordConfirmation}
									setShow={setShowPasswordConfirmation}
								/>
							}
						/>

						<Link
							to={{
								pathname: "/login",
								search: params.get("redirect") ? `?redirect=${params.get("redirect")}` : ""
							}}
							className="text-center text-white underline hover:text-slate-400"
						>
							Vous avez déjà un compte ? Connectez-vous
						</Link>

						{/* <Link to="/forgot-password" className="text-white underline hover:text-slate-400 text-center">Mot de passe oublié ?</Link> */}

						<Button
							variant="default"
							type="submit"
							className={`${isSubmitting ? "opacity-50" : "hover:bg-green-700"} flex flex-row items-center justify-center gap-2 rounded bg-green-500 p-4 text-white`}
							disabled={isSubmitting}
						>
							<MdAdd size={20} className={`${isSubmitting ? "hidden" : "block"}`} />
							<div className={`${isSubmitting ? "block" : "hidden"} loader size-5`} />
							Créer un compte
						</Button>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}

function ShowButtonComponent({ show, setShow }: { show: boolean; setShow: (show: boolean) => void }) {
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
	// biome-ignore lint/style/useNamingConvention: <explanation>
	Icon?: IconType
	errors?: FieldErrors
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	register?: any
	// biome-ignore lint/style/useNamingConvention: <explanation>
	ShowButton?: JSX.Element
}

function InputForm({
	parentClass,
	errorClass,
	type = "text",
	placeholder,
	autoComplete,
	className,
	id,
	name,
	Icon,
	errors,
	register,
	ShowButton
}: InputFormProps) {
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

			{errors && name && errors[name] ? (
				<span className={`w-full text-center text-red-500 lg:text-left ${errorClass}`}>
					{errors[name]?.message?.toString()}
				</span>
			) : null}
		</div>
	)
}
