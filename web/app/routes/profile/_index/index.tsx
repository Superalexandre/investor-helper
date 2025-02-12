import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, Link, redirect, useLoaderData } from "@remix-run/react"
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
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { BellIcon, BellOffIcon, CalendarClockIcon, LockIcon, NewspaperIcon, Settings2Icon } from "lucide-react"
import { useState, type ReactNode } from "react"
import crypto from "node:crypto"
import { getNotificationList } from "../../../../utils/notifications"
import { cn } from "../../../lib/utils"

const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
const db = drizzle(sqlite)

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		return redirect("/login?redirect=/profile")
	}

	const algorithm = "aes-256-cbc"
	const key = Buffer.from(process.env.CRYPTO_KEY as string, "hex")
	const iv = Buffer.from(process.env.CRYPTO_IV as string, "hex")

	const decipher = crypto.createDecipheriv(algorithm, key, iv)

	let emailClear = decipher.update(user.email, "hex", "utf8")
	emailClear += decipher.final("utf8")

	const [wallet, notificationList] = await Promise.all([
		getWalletByUser(user),
		getNotificationList(user.id, 5, 0)
	])
	// const wallet = await getWalletByUser(user)
	// const notificationList = await getNotificationList(user.id, 10, 0)

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
		notificationList,
		watchList: [],
		email: {
			clear: emailClear,
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

export default function Index(): ReactNode {
	const { user, wallet, email, notificationList } = useLoaderData<typeof loader>()

	return (
		<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
			<div className="flex flex-row items-center justify-center gap-4">
				<img
					src={`https://api.dicebear.com/7.x/bottts/png?seed=${user.username}`}
					alt={user.username}
					className="size-10 rounded-full"
				/>

				<h1 className="font-bold text-2xl">{user.displayName ?? user.username}</h1>
			</div>

			<div className="flex w-full flex-col gap-4">
				{user.emailVerified ? null : (
					<div className="flex w-full justify-center">
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

				<div className="flex w-full flex-col items-stretch justify-center gap-4 lg:flex-row">
					<Card className="w-full lg:w-1/2">
						<CardHeader>
							<CardTitle>Informations</CardTitle>
						</CardHeader>
						<CardContent className="flex h-full flex-col gap-4">
							<div className="flex flex-col gap-1">
								<p>Username :</p>
								<p>{user.displayName ?? user.username}</p>
							</div>
							<div className="flex flex-col gap-1">
								<p>Prenom :</p>
								<p>{user.firstName}</p>
							</div>
							<div className="flex flex-col gap-1">
								<p>Nom :</p>
								<p>{user.lastName}</p>
							</div>

							<div className="flex flex-col gap-1">
								<p>Email :</p>
								<p>{email.clear}</p>
							</div>
							<div className="flex flex-col gap-1">
								<p>Compte créer :</p>
								<p>{new Date(user.createdAt).toLocaleDateString("fr-FR", {
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "numeric",
									minute: "numeric",
									second: "numeric"
								})}</p>
							</div>

							<div className="flex flex-col gap-2 lg:ml-auto lg:flex-row lg:items-center">
								<Button variant="destructive" className="flex flex-row gap-2">
									Supprimer mon compte
								</Button>
								<Button variant="default" className="flex flex-row gap-2">
									<p>Modifier mes informations</p>

									<Settings2Icon className="h-6 w-6" />
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="w-full lg:w-1/2">
						<CardHeader>
							<CardTitle>Portefeuilles</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							{wallet.length > 0 ? (
								wallet.map((w) => (
									<Link key={w.walletId} to={`/wallet/${w.walletId}`} className="flex flex-col gap-1">
										<div className="flex flex-row items-center gap-2">
											{w.private ? <LockIcon className="h-6 w-6" /> : null}

											<p className="truncate">{w.name}</p>
										</div>

										{w.description ? <p className="truncate text-muted-foreground text-sm">{w.description}</p> : <p className="truncate text-muted-foreground text-sm">Aucune description</p>}
									</Link>
								))
							) : (
								<p>Vous n'avez pas de portefeuille</p>
							)}

							<div className="my-auto flex flex-col gap-2 lg:ml-auto lg:flex-row lg:items-center">
								<NewWallet />
							</div>
						</CardContent>
					</Card>
				</div>

				<LastNotifications notificationList={notificationList} />
			</div>
		</div>
	)
}

function LastNotifications({
	notificationList
}: {
	notificationList: {
		list: {
			type: "news" | "event";
			url: string;
			body: string;
			createdAt: string | null;
			userId: string;
			notificationId: string;
			notificationFromId: string;
			title: string;
			icon: string | null;
			image: string | null;
			isRead: boolean;
		}[]
	}
}) {
	const [hidden,] = useState(false)

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex flex-row items-center">
					<p>Dernières notifications</p>

					{/* <Button variant="ghost" className="ml-auto" onClick={(): void => setHidden(!hidden)}>
						{hidden ? "Afficher" : "Cacher"}
					</Button> */}
				</CardTitle>
			</CardHeader>
			{hidden ? null : (
				<CardContent className="flex h-full flex-col gap-1">
					<div className="flex flex-col gap-4">
						{notificationList.list.length > 0 ? (
							notificationList.list.map((n) => (
								<Link key={n.notificationId} to={n.url} className="flex flex-col gap-0.5">
									<p className="flex flex-row items-center gap-2 truncate">
										<IconType type={n.type} className="size-5" />

										{n.title}
									</p>
									<p className="truncate text-muted-foreground">{n.body}</p>
									<p className="text-muted-foreground">{new Date(n.createdAt ?? new Date()).toLocaleDateString("fr-FR", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "numeric",
										minute: "numeric",
										second: "numeric"
									})}</p>
								</Link>
							))
						) : (
							<p>Vous n'avez pas de notification</p>
						)}
					</div>

					<div className="my-auto flex flex-col gap-2 lg:ml-auto lg:flex-row">
						<Button variant="default" asChild={true}>
							<Link to="/profile/notifications" className="flex flex-row gap-2">
								Voir mes notifications

								<BellIcon className="h-6 w-6" />
							</Link>
						</Button>

						<Button variant="default" asChild={true}>
							<Link to="/profile/settings/notifications" className="flex flex-row gap-2">
								Configurer mes notifications

								<BellOffIcon className="h-6 w-6" />
							</Link>
						</Button>

					</div>
				</CardContent>
			)}
		</Card>
	)
}

function IconType({ type, className }: { type: "news" | "event", className?: string }): ReactNode {
	if (type === "news") {
		return <NewspaperIcon className={cn(className)} />
	}

	return <CalendarClockIcon className={cn(className)} />
}