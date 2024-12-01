import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { redirect } from "@remix-run/react"
import { MdAdd } from "react-icons/md"
import { getValidatedFormData } from "remix-hook-form"
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { getUser } from "@/session.server"
import createAccount from "./createAccount"
import Register, { type FormData, resolver } from "../../components/form/register"
import i18next from "../../i18next.server"
import { useTranslation } from "react-i18next"

export async function loader({ request }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "register")
	const user = await getUser(request)

	if (user) {
		return redirect("/profile")
	}

	const title = t("title")
	const description = t("description")

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

	const result = await createAccount({ request, ...data })

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
		{ name: "canonical", content: "https://www.investor-helper.com/register" }
	]
}

export const handle = {
	i18n: "register"
}

export default function Index() {
	const { t } = useTranslation("register")

	return (
		<div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
			<Card className="size-full lg:size-1/2">
				<CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl text-white">
					<MdAdd size={30} />
					{t("createAccount")}
				</CardTitle>
				<CardContent className="flex h-full w-full items-center justify-center">
					<div className="w-11/12 lg:w-1/2">
						<Register />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
