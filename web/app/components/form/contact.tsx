import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@remix-run/react"
import { z as zod } from "zod"
import InputForm, { type FieldErrors } from "./inputForm"
import { useRemixForm } from "remix-hook-form"
import { Button } from "../ui/button"
import { MdSend } from "react-icons/md"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { useEffect } from "react"
import { toast as sonner } from "sonner"
import Loading from "../loading"

const schema = zod.object({
	name: zod.string().min(3).max(32).trim(),
	email: zod.string().email().trim().toLowerCase(),
	message: zod.string().min(10).max(500).trim()
})

type FormData = zod.infer<typeof schema>
const resolver = zodResolver(schema)

export default function Contact() {
	const {
		handleSubmit,
		formState: { errors, isSubmitting, isSubmitSuccessful },
		register,
		reset
	} = useRemixForm<FormData>({
		mode: "onSubmit",
		submitConfig: {
			action: "/contact",
			method: "post"
		},
		resolver
	})

	useEffect(() => {
		if (isSubmitSuccessful) {
			reset()

			sonner("Message envoyé", {
				description: "Votre message a bien été envoyé",
				closeButton: true,
				id: "send-success"
			})
		}
	}, [reset, isSubmitSuccessful])

	return (
		<Form method="post" action="/contact" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-4">
				<InputForm
					type="text"
					name="name"
					id="name"
					placeholder="Nom"
					autoComplete="name"
					errors={errors as FieldErrors}
					register={register}
				/>

				<InputForm
					type="email"
					name="email"
					id="email"
					placeholder="Email"
					autoComplete="email"
					errors={errors as FieldErrors}
					register={register}
				/>

				<div>
					<Label htmlFor="message">Message</Label>
					<Textarea id="message" placeholder="Message" {...register("message")} />

					{errors?.message ? (
						<span className="w-full text-center text-red-500 lg:text-left">
							{errors.message?.message?.toString()}
						</span>
					) : null}
				</div>

				<Button
					variant="default"
					type="submit"
					className={`${isSubmitting ? "opacity-50" : "hover:bg-green-700"} flex flex-row items-center justify-center gap-2 rounded bg-green-500 p-4 text-white`}
					disabled={isSubmitting}
				>
					{isSubmitting ? <Loading className="size-5 border-2" /> : <MdSend size={20} />}
					Envoyer
				</Button>
			</div>
		</Form>
	)
}

export { resolver, schema }
export type { FormData }
