import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
// import getUser from "@/utils/getUser"
import NewWallet from "@/components/wallet/new"
import { getUser } from "@/session.server"
import { getWalletByUser } from "@/utils/getWallet"

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		return redirect("/")
	}

	const wallet = await getWalletByUser(user)

	// const { user, wallet, watchList } = await getUser({ id: "62d56f78-1b1b-411f-ba77-59d749e265ed" })

	// if (!user) return redirect("/")

	// return {
	//     user: user,
	//     wallet: wallet,
	//     watchList: watchList
	// }
	return {
		user,
		wallet,
		watchList: []
	}
}

export const meta: MetaFunction = () => {
	return [
		{ title: "Investor Helper - Votre profile" }
		// { name: "description", content: "Welcome to Remix!" },
	]
}

export default function Index() {
	const { user, wallet } = useLoaderData<typeof loader>()

	return (
		<div className="flex w-full flex-col items-center justify-center gap-10">
			<div>
				<p>User : {user.id}</p>
			</div>

			<div className="flex flex-col items-center justify-center gap-1">
				<h1 className="font-bold text-xl">Vos portefeuilles</h1>

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

			{/* <p>Vos listes surveillés</p>
            {watchList.length > 0 ? watchList.map((w) => (
                <p key={w.listId}>WatchList : {w.name}</p>
            )): (
                <p>Vous n'avez pas de liste surveillé</p>
            )} */}
		</div>
	)
}
