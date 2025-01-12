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
import { LockKeyholeIcon, LogInIcon, UserIcon, UserRoundPlusIcon } from "lucide-react"
import { Separator } from "../ui/separator"
import { GoogleIcon } from "../svg/GoogleIcon"

const schema = zod.object({
	emailOrUsername: zod
		.string({
			required_error: "errors.emailOrUsernameRequired",
		})
		.trim()
		.min(3, "errors.emailOrUsernameMinLength")
		.max(255, "errors.emailOrUsernameMaxLength"),
	password: zod
		.string({
			coerce: true,
			required_error: "passwordRequired",
		})
		.min(8, "errors.passwordMinLength")
		.max(255, "errors.passwordMaxLength")
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
		register,
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
				t={t}
			/>

			<div className="flex w-full flex-col items-start">
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
					t={t}
				/>
				<Button variant="link" asChild={true} className="p-0">
					<Link to="/forgot-password">
						{t("forgotPassword")}
					</Link>
				</Button>
			</div>

			<Button
				variant="default"
				type="submit"
				className="flex w-full flex-row items-center justify-center gap-2"
				disabled={isSubmitting}
			>
				{isSubmitting ? <Loading className="size-5 border-2 text-secondary" /> : <LogInIcon className="size-5" />}

				{t("connect")}
			</Button>

			<Separator className="w-full bg-primary" />

			<div className="flex w-full flex-col items-center justify-center gap-2 lg:flex-row lg:justify-between">
				<Button size="lg" variant="outline" type="button" asChild={true} className="flex w-full flex-row items-center justify-center gap-2">
					<Link
						to={{
							pathname: "/register",
							search: preferredRedirect !== "" ? `?redirect=${preferredRedirect}` : ""
						}}
						className="flex flex-row items-center justify-center gap-2"
					>
						<UserRoundPlusIcon className="size-5" />

						{t("createAccount")}
					</Link>
				</Button>

				<Button size="lg" variant="outline" type="button" asChild={true} className="flex w-full flex-row items-center justify-center gap-2">
					<Link to={`/login/auth/google?redirect=${preferredRedirect}`}>
						<GoogleIcon className="fill-primary" />

						{t("loginGoogle")}
					</Link>
				</Button>
			</div>
		</Form>
	)
}

export { resolver, schema }
export type { FormData }
