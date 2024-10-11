import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { redirect } from "@remix-run/react"
import { MdAdd } from "react-icons/md"
import { getValidatedFormData } from "remix-hook-form"
import { type ActionFunctionArgs, json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { getUser } from "@/session.server"
import createAccount from "./createAccount"
import Register, { type FormData, resolver } from "../../components/form/register"

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
	return (
		<div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
			<Card className="size-full lg:size-1/2">
				<CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl text-white">
					<MdAdd size={30} />
					Créer un compte
				</CardTitle>
				<CardContent className="h-full">
					<Register />
				</CardContent>
			</Card>
		</div>
	)
}
