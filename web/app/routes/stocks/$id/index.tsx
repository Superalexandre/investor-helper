import type { MetaFunction } from "@remix-run/node"
import { useParams } from "@remix-run/react"

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const params = useParams()

    return (
        <div>
            <p>Crypto : {params.id}</p>
        </div>
    )
}