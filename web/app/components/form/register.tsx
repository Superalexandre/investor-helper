import { Form, Link, useSearchParams } from "@remix-run/react"
import InputForm, { type FieldErrors } from "./inputForm"
import { useEffect, useState } from "react"
import { MdAdd, MdBadge, MdEmail, MdPassword } from "react-icons/md"
import { useRemixForm } from "remix-hook-form"
import { z as zod } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { ShowButtonComponent } from "../button/showHideButton"
import { Label } from "../ui/label"
import { Checkbox } from "../ui/checkbox"
import Loading from "../loading"

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
	passwordConfirmation: zod.string().min(8).max(255),
	terms: zod.boolean().refine(value => value === true, "You must agree to the terms and conditions")
})

type FormData = zod.infer<typeof schema>
const resolver = zodResolver(schema)

interface RegisterProps {
	redirect?: string
	callback?: () => void
}

export default function Register({ redirect, callback }: RegisterProps) {
	const [showPassword, setShowPassword] = useState(false)
	const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
	const [params] = useSearchParams()

	const redirectUrl = params.get("redirect")

	let preferredRedirect = ""
	if (redirect) {
		preferredRedirect = redirect
	} else if (redirectUrl) {
		preferredRedirect = redirectUrl
	}

	const {
		handleSubmit,
		formState: { errors, isSubmitting, isSubmitSuccessful },
		register
	} = useRemixForm<FormData>({
		mode: "onSubmit",
		submitConfig: {
			action: `/register?redirect=${preferredRedirect}`,
			method: "post"
		},
		resolver
	})

	useEffect(() => {
		if (isSubmitSuccessful && callback) {
			callback()
		}
	}, [callback, isSubmitSuccessful])

	return (
		<Form
			action="/register"
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
					<ShowButtonComponent show={showPasswordConfirmation} setShow={setShowPasswordConfirmation} />
				}
			/>

			<div className="flex flex-col items-center">
				<div className="flex flex-row items-center gap-2">
					<Checkbox
						id="terms"
						required={true}
						{...register("terms", {
							required: true,
							value: true
						})}
					/>

					<Label htmlFor="terms" className="space-x-1 text-white">
						<span>J'accepte les</span>
						<Link to="/terms" className="text-white underline hover:text-slate-400">
							conditions d'utilisation
						</Link>
						<span>et la</span>
						<Link to="/privacy" className="text-white underline hover:text-slate-400">
							politique de confidentialité
						</Link>
					</Label>
				</div>

				{errors?.terms ? (
					<span className="w-full text-center text-red-500 lg:text-left">
						{errors.terms?.message?.toString()}
					</span>
				) : null}
			</div>

			<Link
				to={{
					pathname: "/login",
					search: preferredRedirect !== "" ? `?redirect=${preferredRedirect}` : ""
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
				{isSubmitting ? (
					<Loading className="size-5 border-2" />
				) : (
					<MdAdd size={20} />
				)}

				Créer un compte
			</Button>
		</Form>
	)
}

export { resolver, schema }
export type { FormData }
