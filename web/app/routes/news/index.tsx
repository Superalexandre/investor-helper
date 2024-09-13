import type { MetaFunction } from "@remix-run/node"
import { getNews } from "@/utils/getNews"
import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react"
import {
    Card,
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
    const limitResult = limit ? parseInt(limit) : 60
    const pageResult = page ? parseInt(page) : 1

    const news = await getNews({ limit: limitResult, page: pageResult })

    return {
        news
    }
}


export const meta: MetaFunction = () => {
    return [
        { title: "Investor Helper - Les actualités" },
    ]
}

export default function Index() {
    const { news } = useLoaderData<typeof loader>()

    return (
        <div>
            <div className="flex flex-col items-center justify-center space-y-4">
                <p className="pt-4 text-center text-2xl font-bold">Dernières actualités</p>

                {/* <Button variant="default">
                    Rafraîchir
                </Button> */}
            </div>

            <div className="flex flex-col space-y-6 p-10">
                {news.map((item) => (
                    <div className="relative">
                        <Badge variant="destructive" className="absolute -right-[10px] -top-[10px]">!</Badge>
                        

                        <Card key={item.news.id}>
                            <Link to={`/news/${item.news.id}`} key={item.news.id}>
                                <CardHeader>
                                    <CardTitle>{item.news.title}</CardTitle>
                                </CardHeader>
                            </Link>
                            <CardFooter className="flex flex-row flex-wrap items-center gap-1.5">
                                {item.relatedSymbols?.map((symbol) => (
                                    <Link to={`/stocks/${symbol?.symbol}`} key={symbol?.symbol}>
                                        <Badge
                                            key={symbol?.symbol}
                                            variant="default"
                                            className="flex h-8 flex-row items-center justify-center"
                                        >
                                            {symbol?.logoid ?
                                                <img
                                                    src={"https://s3-symbol-logo.tradingview.com/" + symbol?.logoid + ".svg"}
                                                    alt={symbol?.symbol}
                                                    className="mr-1.5 size-6 rounded-full"
                                                />
                                                : null
                                            }
                                            {symbol?.symbol}
                                        </Badge>
                                    </Link>
                                ))}
                            </CardFooter>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    )
}