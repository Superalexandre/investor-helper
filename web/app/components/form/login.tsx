import { Form, Link, useSearchParams } from "@remix-run/react"
import InputForm, { type FieldErrors } from "./inputForm"
import { useEffect, useState } from "react"
import { useRemixForm } from "remix-hook-form"
import { z as zod } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { ShowButtonComponent } from "../button/showHideButton"
import Loading from "../loading"
import { useTranslation } from "react-i18next"
import { LockKeyholeIcon, LogInIcon, UserIcon } from "lucide-react"

const schema = zod.object({
	emailOrUsername: zod.string().trim().min(3).max(255),
	password: zod
		.string({
			coerce: true
		})
		.min(8)
		.max(255)
})
type FormData = zod.infer<typeof schema>

const resolver = zodResolver(schema)

interface LoginProps {
	redirect?: string
	callback?: () => void
}

export default function Login({ redirect, callback }: LoginProps) {
	const { t } = useTranslation("login", {
		useSuspense: false
	})
	const [showPassword, setShowPassword] = useState(false)
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
			action: `/login?redirect=${preferredRedirect}`,
			method: "POST"
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
			action="/login"
			method="POST"
			onSubmit={handleSubmit}
			className="flex size-full flex-col items-center justify-center gap-4"
		>
			<InputForm
				type="text"
				name="emailOrUsername"
				id="emailOrUsername"
				placeholder={t("placeholders.emailOrUsername")}
				autoComplete="username email"
				errors={errors as FieldErrors}
				register={register}
				Icon={UserIcon}
			/>

			<InputForm
				type={showPassword ? "text" : "password"}
				name="password"
				id="password"
				placeholder={t("placeholders.password")}
				autoComplete="current-password"
				errors={errors as FieldErrors}
				register={register}
				Icon={LockKeyholeIcon}
				ShowButton={<ShowButtonComponent show={showPassword} setShow={setShowPassword} />}
			/>

			<Link
				to={{
					pathname: "/register",
					search: preferredRedirect !== "" ? `?redirect=${preferredRedirect}` : ""
				}}
				className="text-center underline hover:text-slate-400 dark:text-white"
			>
				{t("notRegistered")}
			</Link>
			{/* <Link to="/forgot-password" className="text-white underline hover:text-slate-400 text-center">Mot de passe oublié ?</Link> */}

			<Button
				variant="default"
				type="submit"
				className="flex flex-row items-center justify-center gap-2"
				disabled={isSubmitting}
			>
				{isSubmitting ? <Loading className="size-5 border-2 dark:text-black" /> : <LogInIcon className="size-5" />}

				{t("connect")}
			</Button>
		</Form>
	)
}

export { resolver, schema }
export type { FormData }
