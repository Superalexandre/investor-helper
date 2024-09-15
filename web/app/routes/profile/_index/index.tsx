import type { MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
import getUser from "@/utils/getUser"
import NewWallet from "@/components/wallet/new"

export async function loader() {
    const { user, wallet, watchList } = await getUser({ id: "62d56f78-1b1b-411f-ba77-59d749e265ed" })

    if (!user) return redirect("/")

    return {
        user: user,
        wallet: wallet,
        watchList: watchList
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const { user, wallet } = useLoaderData<typeof loader>()

    return (
        <div>
            <p>User : {user.id}</p>

            <p>Votre portefeuille</p>
            {wallet.length > 0 ? wallet.map((w) => (
                <Link
                    key={w.walletId}
                    to={`/wallet/${w.walletId}`}
                >
                    {w.name}
                </Link>
            )) : (
                <div>
                    <p>Vous n'avez pas de portefeuille</p>

                    <NewWallet />
                </div>

            )}

            {/* <p>Vos listes surveillés</p>
            {watchList.length > 0 ? watchList.map((w) => (
                <p key={w.listId}>WatchList : {w.name}</p>
            )): (
                <p>Vous n'avez pas de liste surveillé</p>
            )} */}
        </div>
    )
}