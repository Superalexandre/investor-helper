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
            <div className="mt-4 flex flex-col items-center justify-center">
                <img 
                    src="/logo-1024-1024.png" 
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