import type { MetaFunction } from "@remix-run/node"
import { getNews } from "@/utils/getNews"
import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export async function loader({
    params,
}: ClientLoaderFunctionArgs) {
    const { limit, page } = params

    // Convert the limit and page to numbers
    const limitResult = limit ? parseInt(limit) : 30
    const pageResult = page ? parseInt(page) : 1

    const news = await getNews({ limit: limitResult, page: pageResult })

    return {
        news
    }
}


export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const { news } = useLoaderData<typeof loader>()

    return (
        <div>
            <p className="pt-4 text-center text-2xl font-bold">Dernières actualités</p>
            
            <div className="flex flex-col space-y-2 p-10">
                {news.map((item) => (
                    <Link to={`/news/${item.news.id}`} key={item.news.id} className="relative">
                        <Badge variant="destructive" className="absolute top-0 -right-[10px]">!</Badge>
                        <Card key={item.news.id}>
                            <CardHeader>
                                <CardTitle>{item.news.title}</CardTitle>
                            </CardHeader>
                            <CardFooter className="space-x-1">
                                {item.relatedSymbols?.map((symbol) => (
                                    <Link to={`/stocks/${symbol?.symbol}`} key={symbol?.symbol}>
                                        <Badge
                                            key={symbol?.symbol}
                                            variant="default"
                                        >
                                            {symbol?.symbol}
                                        </Badge>
                                    </Link>
                                ))}
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}