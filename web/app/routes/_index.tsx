import type { MetaFunction } from "@remix-run/node"

export const meta: MetaFunction = () => {
    return [
        { title: "Investor Helper" },
        // { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    return (
        <div>
            <p>Accueil</p>
            <a href="/news">News</a>
        </div>
 
    )
}