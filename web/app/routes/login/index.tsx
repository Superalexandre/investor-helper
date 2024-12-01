import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { redirect } from "@remix-run/react"
import { MdLogin } from "react-icons/md"
import { getValidatedFormData } from "remix-hook-form"
import login from "./login"
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { getUser } from "@/session.server"
import Login, { type FormData, resolver } from "../../components/form/login"
import i18next from "../../i18next.server"
import { useTranslation } from "react-i18next"

export async function loader({ request }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "login")
	const user = await getUser(request)

	const title = t("title")
	const description = t("description")

	if (user) {
		return redirect("/profile")
	}

	return {
		title: title,
		description: description
	}
}

export async function action({ request }: ActionFunctionArgs) {
	const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver)

	if (errors) {
		return { errors, defaultValues }
	}

	// Await 5s to simulate a slow request
	await new Promise((resolve) => setTimeout(resolve, 5000))

	const result = await login({ request, ...data })

	return result
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return []
	}

	const { title, description } = data

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://www.investor-helper.com/login" }
	]
}

export const handle = {
	i18n: "login"
}

export default function Index() {
	const { t } = useTranslation("login")

	return (
		<div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
			<Card className="size-full lg:size-1/2">
				<CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl dark:text-white">
					<MdLogin size={30} />

					{t("connexion")}
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
