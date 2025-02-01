import Contact, { type FormData, resolver } from "../../components/form/contact"
import { Card, CardContent, CardTitle } from "../../components/ui/card"
import { getValidatedFormData } from "remix-hook-form"
import type { ActionFunctionArgs } from "@remix-run/node"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { contactSchema } from "@/schema/contact"
import { v4 as uuid } from "uuid"
import { ShieldAlertIcon } from "lucide-react"

export async function action({ request }: ActionFunctionArgs) {
	const { errors, data, receivedValues: defaultValues } = await getValidatedFormData<FormData>(request, resolver)

	if (errors) {
		return { errors, defaultValues }
	}

	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	await db.insert(contactSchema).values({
		id: uuid(),
		name: data.name,
		email: data.email,
		message: data.message
	})

	return {
		message: "Message envoyé avec succès"
	}
}

export default function Index() {
	return (
		<div className="flex h-screen w-screen flex-1 flex-col items-center justify-center p-4">
			<Card className="size-full lg:size-1/2">
				<CardTitle className="flex flex-row items-center justify-center gap-2 pt-4 pb-8 text-center font-bold text-3xl text-white">
					<ShieldAlertIcon className="size-8" />
					Contact
				</CardTitle>
				<CardContent className="flex h-full w-full items-center justify-center">
					<div className="w-11/12 lg:w-1/2">
						<Contact />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
