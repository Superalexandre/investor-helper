import { Form, Link, useSearchParams } from "@remix-run/react"
import InputForm, { type FieldErrors } from "./inputForm"
import { useEffect, useState } from "react"
import { useRemixForm } from "remix-hook-form"
import { z as zod } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { ShowButtonComponent } from "../button/showHideButton"
import { Label } from "../ui/label"
import { Checkbox } from "../ui/checkbox"
import Loading from "../loading"
import { useTranslation } from "react-i18next"
import { IdCardIcon, LockKeyholeIcon, LogInIcon, MailIcon, PlusIcon } from "lucide-react"
import { Separator } from "../ui/separator"
import { GoogleIcon } from "../svg/GoogleIcon"

const schema = zod.object({
	name: zod.string({
	}).min(3, "errors.nameMinLength").max(32, "errors.nameMaxLength").trim(),
	firstName: zod.string().min(3, "errors.firstNameMinLength").max(32, "errors.firstNameMaxLength").trim(),
	username: zod
		.string()
		.min(3, "errors.usernameMinLength")
		.max(32, "errors.usernameMaxLength")
		.trim()
		.regex(/^[a-zA-Z0-9_]+$/, "errors.usernameInvalid"),
	email: zod.string().email("errors.emailInvalid").trim().toLowerCase(),
	password: zod.string().min(8, "errors.passwordMinLength").max(255, "errors.passwordMaxLength"),
	passwordConfirmation: zod.string().min(8, "errors.passwordMinLength").max(255, "errors.passwordMaxLength"),
	terms: zod.boolean().refine((value) => value === true, "You must agree to the terms and conditions")
}).refine(data => data.password === data.passwordConfirmation, {
	message: "errors.confirmPassword",
	path: ["passwordConfirmation"]
})

type FormData = zod.infer<typeof schema>
const resolver = zodResolver(schema)

interface RegisterProps {
	redirect?: string
	callback?: () => void
}

export default function Register({ redirect, callback }: RegisterProps) {
	const { t } = useTranslation("register", {
		useSuspense: false
	})
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
			action="/register"
			method="POST"
			onSubmit={handleSubmit}
			className="flex size-full max-h-full flex-col items-center justify-center gap-4"
		>
			<InputForm
				type="text"
				name="name"
				id="name"
				placeholder={t("placeholders.name")}
				autoComplete="name"
				errors={errors as FieldErrors}
				register={register}
				Icon={IdCardIcon}
				t={t}
			/>

			<InputForm
				type="text"
				name="firstName"
				id="firstName"
				placeholder={t("placeholders.firstName")}
				autoComplete="given-name"
				errors={errors as FieldErrors}
				register={register}
				Icon={IdCardIcon}
				t={t}
			/>

			<InputForm
				type="text"
				name="username"
				id="username"
				placeholder={t("placeholders.username")}
				autoComplete="username"
				errors={errors as FieldErrors}
				register={register}
				Icon={IdCardIcon}
				t={t}
			/>

			<InputForm
				type="email"
				name="email"
				id="email"
				placeholder={t("placeholders.email")}
				autoComplete="email"
				errors={errors as FieldErrors}
				register={register}
				Icon={MailIcon}
				t={t}
			/>

			<InputForm
				type={showPassword ? "text" : "password"}
				name="password"
				id="password"
				placeholder={t("placeholders.password")}
				autoComplete="new-password"
				errors={errors as FieldErrors}
				register={register}
				Icon={LockKeyholeIcon}
				ShowButton={<ShowButtonComponent show={showPassword} setShow={setShowPassword} />}
				t={t}
			/>

			<InputForm
				type={showPasswordConfirmation ? "text" : "password"}
				name="passwordConfirmation"
				id="passwordConfirmation"
				placeholder={t("placeholders.confirmPassword")}
				autoComplete="new-password"
				errors={errors as FieldErrors}
				register={register}
				Icon={LockKeyholeIcon}
				ShowButton={
					<ShowButtonComponent show={showPasswordConfirmation} setShow={setShowPasswordConfirmation} />
				}
				t={t}
			/>

			<div className="flex flex-col items-center">
				<div className="flex flex-row items-center gap-4">
					<Checkbox
						id="terms"
						required={true}
						{...register("terms", {
							required: true,
							value: true
						})}
					/>

					<Label htmlFor="terms" className="flex w-full flex-row flex-wrap items-center gap-1 dark:text-white">
						<span className="">{t("accept")}</span>

						<Button variant="link" asChild={true} className="inline-block h-auto p-0 underline hover:no-underline">
							<Link to="/terms">
								{t("terms")}
							</Link>
						</Button>

						<span className="">{t("and")}</span>

						<Button variant="link" asChild={true} className="inline-block h-auto p-0 underline hover:no-underline">
							<Link to="/privacy">
								{t("privacy")}
							</Link>
						</Button>
					</Label>
				</div>

				{errors?.terms ? (
					<span className="w-full text-center text-red-500 lg:text-left">
						{errors.terms?.message?.toString()}
					</span>
				) : null}
			</div>

			<Button
				variant="default"
				type="submit"
				className="flex w-full flex-row items-center justify-center gap-2"
				disabled={isSubmitting}
			>
				{isSubmitting ? <Loading className="size-5 border-2 text-secondary" /> : <PlusIcon className="size-5" />}

				{t("createAccount")}
			</Button>

			<Separator className="w-full bg-primary" />

			<div className="flex w-full flex-row flex-wrap items-center justify-center gap-2">
				<Button size="lg" variant="outline" type="button" asChild={true} className="flex w-auto flex-grow flex-row items-center justify-center gap-2">
					<Link
						to={{
							pathname: "/login",
							search: preferredRedirect !== "" ? `?redirect=${preferredRedirect}` : ""
						}}
					>
						<LogInIcon className="size-5" />

						{t("connection")}
					</Link>
				</Button>

				<Button size="lg" variant="outline" type="button" asChild={true} className="flex w-auto flex-grow flex-row items-center justify-center gap-2">
					<Link to={`/login/auth/google?redirect=${preferredRedirect}`}>
						<GoogleIcon className="fill-primary" />

						{t("createGoogleAccount")}
					</Link>
				</Button>
			</div>
		</Form>
	)
}

export { resolver, schema }
export type { FormData }
