import { Form, Link, useSearchParams } from "@remix-run/react"
import InputForm, { type FieldErrors } from "./inputForm"
import { useState } from "react"
import { MdLogin, MdMail, MdPassword } from "react-icons/md"
import { useRemixForm } from "remix-hook-form"
// biome-ignore lint/style/noNamespaceImport: Zod is a namespace
import * as zod from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { ShowButtonComponent } from "./showHideButton"

const schema = zod.object({
	mailOrUsername: zod.string().trim().min(3).max(255),
	password: zod
		.string({
			coerce: true
		})
		.min(8)
		.max(255)
})
type FormData = zod.infer<typeof schema>

const resolver = zodResolver(schema)

export default function Login() {
	const [showPassword, setShowPassword] = useState(false)
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
				placeholder="Nom d'utilisateur ou email"
				autoComplete="username email"
				errors={errors as FieldErrors}
				register={register}
				Icon={MdMail}
			/>

			<InputForm
				type={showPassword ? "text" : "password"}
				name="password"
				id="password"
				placeholder="Mot de passe"
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
			{/* <Link to="/forgot-password" className="text-white underline hover:text-slate-400 text-center">Mot de passe oublié ?</Link> */}

			<Button
				variant="default"
				type="submit"
				className={`${isSubmitting ? "opacity-50" : "hover:bg-green-700"} flex flex-row items-center justify-center gap-2 rounded bg-green-500 p-4 text-white`}
				disabled={isSubmitting}
			>
				<MdLogin size={20} className={`${isSubmitting ? "hidden" : "block"}`} />
				<div className={`${isSubmitting ? "block" : "hidden"} loader size-5`} />
				Se connecter
			</Button>
		</Form>
	)
}

export { resolver, schema }
export type { FormData }