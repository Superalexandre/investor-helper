import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { redirect } from "@remix-run/react"
import { MdLogin } from "react-icons/md"
import { getValidatedFormData } from "remix-hook-form"
import login from "./login"
import { type ActionFunctionArgs, json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { getUser } from "@/session.server"
import Login, { type FormData, resolver } from "../../components/form/login"

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

	const result = await login({ request, ...data })

	return result
}

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Connexion"
	const description = "Connectez-vous à votre compte Investor Helper"

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://www.investor-helper.com/login" }
	]
}

export default function Index() {
	return (
		<div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
			<Card className="size-full lg:size-1/2">
				<CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl text-white">
					<MdLogin size={30} />
					Connexion
				</CardTitle>
				<CardContent className="flex h-full w-full items-center justify-center">
					<div className="w-11/12 lg:w-1/2">
						<Login />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
