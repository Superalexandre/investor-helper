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
import { IdCardIcon, LockKeyholeIcon, MailIcon, PlusIcon } from "lucide-react"

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
				<div className="flex flex-row items-center gap-2">
					<Checkbox
						id="terms"
						required={true}
						{...register("terms", {
							required: true,
							value: true
						})}
					/>

					<Label htmlFor="terms" className="space-x-1 dark:text-white">
						<span>{t("accept")}</span>
						<Link to="/terms" className="underline hover:text-slate-400 dark:text-white">
							{t("terms")}
						</Link>
						<span>{t("and")}</span>
						<Link to="/privacy" className="underline hover:text-slate-400 dark:text-white">
							{t("privacy")}
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
				className="text-center underline hover:text-slate-400 dark:text-white"
			>
				{t("haveAccount")}
			</Link>

			{/* <Link to="/forgot-password" className="text-white underline hover:text-slate-400 text-center">Mot de passe oublié ?</Link> */}

			<Button
				variant="default"
				type="submit"
				className="flex flex-row items-center justify-center gap-2"
				// className={`${isSubmitting ? "opacity-50" : "hover:bg-green-700"} flex flex-row items-center justify-center gap-2 rounded bg-green-500 p-4 text-white`}
				disabled={isSubmitting}
			>
				{isSubmitting ? <Loading className="size-5 border-2 text-secondary" /> : <PlusIcon className="size-5" />}

				{t("createAccount")}
			</Button>
		</Form>
	)
}

export { resolver, schema }
export type { FormData }
