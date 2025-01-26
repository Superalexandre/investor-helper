import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, redirect, useLoaderData } from "react-router";
import NewWallet from "@/components/wallet/new"
import { getUser } from "@/session.server"
import { getWalletByUser } from "@/utils/getWallet"
import { Button } from "../../../components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { verificationEmailSchema } from "../../../../../db/schema/email"
import { eq } from "drizzle-orm"
import { formatDistanceToNow } from "date-fns"

export async function loader({ request }: LoaderFunctionArgs) {
	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const user = await getUser(request)

	if (!user) {
		return redirect("/login?redirect=/profile")
	}

	const wallet = await getWalletByUser(user)

	let shouldDisplayResendEmail = true
	let remainingTime = ""
	if (!user.emailVerified) {
		const emails = await db.select().from(verificationEmailSchema).where(eq(verificationEmailSchema.email, user.email))

		if (emails?.[0]) {
			const email = emails[0]

			// Check if the email is still valid (5 minutes)
			const verificationCreatedAt = new Date(email.createdAt).getTime()
			const FIVE_MINUTES_IN_MS = 1000 * 60 * 5

			if (verificationCreatedAt + FIVE_MINUTES_IN_MS > Date.now()) {
				shouldDisplayResendEmail = false

				remainingTime = formatDistanceToNow(verificationCreatedAt + FIVE_MINUTES_IN_MS, {
					includeSeconds: true
				})
			} else {
				shouldDisplayResendEmail = true
			}
		}
	}

	return {
		user,
		wallet,
		watchList: [],
		email: {
			shouldDisplayResendEmail,
			remainingTime
		}
	}
}

export const meta: MetaFunction = () => {
	return [
		{ title: "Investor Helper - Votre profile" }
		// { name: "description", content: "Welcome to Remix!" },
	]
}

export default function Index() {
	const { user, wallet, email } = useLoaderData<typeof loader>()

	return (
		<div className="flex w-full flex-col items-center justify-center gap-10">
			<div>
				<h1 className="font-bold text-2xl">Bonjour {user.displayName ?? user.username}</h1>
			</div>

			{user.emailVerified ? null : (
				<div className="flex justify-center">
					<Alert variant="destructive" className="px-8 py-4">
						<AlertTitle className="font-bold text-lg">Votre compte n'est pas verifier!</AlertTitle>
						<AlertDescription className="flex flex-col gap-2">
							<p>
								Veuillez verifier votre email pour continuer
							</p>

							{email.shouldDisplayResendEmail ? (
								<Form method="post" action="/profile/verify/send" className="w-full">
									<Button type="submit" variant="default" className="w-full">
										Vérifier mon email
									</Button>
								</Form>
							) : (
								<p>
									Un email de vérification a déjà été envoyé, veuillez patienter {email.remainingTime} avant de
									pouvoir en envoyer un autre.
								</p>
							)}
						</AlertDescription>
					</Alert>
				</div>
			)}

			<div className="flex flex-col items-center justify-center gap-1">
				<h2 className="font-bold text-xl">Vos portefeuilles</h2>

				{wallet.length > 0 ? (
					wallet.map((w) => (
						<Link key={w.walletId} to={`/wallet/${w.walletId}`}>
							{w.name}
						</Link>
					))
				) : (
					<p>Vous n'avez pas de portefeuille</p>
				)}

				<NewWallet className="mt-4" />
			</div>

			{/* 
			<p>Vos listes surveillés</p>
            {watchList.length > 0 ? watchList.map((w) => (
                <p key={w.listId}>WatchList : {w.name}</p>
            )): (
                <p>Vous n'avez pas de liste surveillé</p>
            )} 
			 */}

			<div className="flex flex-col items-center justify-center gap-1">
				<h2 className="font-bold text-xl">Vos notifications</h2>

				<Link to="/profile/settings/notifications">
					<Button>Voir mes notifications</Button>
				</Link>
			</div>
		</div>
	)
}
