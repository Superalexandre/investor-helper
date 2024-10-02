import type { MetaFunction } from "@remix-run/node"

export const meta: MetaFunction = () => {
    const title = "Investor Helper"
    const description = "Bienvenue sur Investor Helper"

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: "https://investor-helper.com" },
    ]
}

export default function Index() {
    return (
        <div>
            <div className="mt-4 flex flex-col items-center justify-center">
                <img 
                    src="/logo-1024-1024.png" 
                    loading="eager"
                    alt="Investor Helper" 
                    className="mx-auto size-32"
                    height="128"
                    width="128"
                />

                <h1 className="text-xl font-bold">Bienvenue sur <span>Investor Helper</span></h1>
            </div>
        </div>
 
    )
}