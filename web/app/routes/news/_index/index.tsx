import type { MetaFunction } from "@remix-run/node"
import { getNews } from "@/utils/getNews"
import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { MdPriorityHigh } from "react-icons/md"
import formatDate from "@/utils/formatDate"

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
                    <div className="relative" key={item.news.id}>
                        <Badge variant="destructive" className="absolute -right-[10px] -top-[10px]">
                            <MdPriorityHigh className="size-5" />

                        </Badge>


                        <Card>
                            <Link to={`/news/${item.news.id}`}>
                                <CardHeader>
                                    <CardTitle>{item.news.title}</CardTitle>
                                </CardHeader>
                            </Link>
                            {item.relatedSymbols && item.relatedSymbols.length > 0 ? (
                                <CardContent className="flex flex-row flex-wrap items-center gap-1.5">
                                    {item.relatedSymbols?.map((symbol) => (
                                        <Link to={`/data/${symbol?.symbol.symbolId}`} key={symbol?.symbol.symbolId}>
                                            <Badge
                                                key={symbol?.symbol.symbolId}
                                                variant="default"
                                                className="flex h-8 flex-row items-center justify-center"
                                            >
                                                {symbol?.symbol.symbolId ?
                                                    <img
                                                        src={"https://s3-symbol-logo.tradingview.com/" + symbol?.symbol.logoid + ".svg"}
                                                        alt={symbol?.symbol.symbolId}
                                                        className="mr-1.5 size-6 rounded-full"
                                                    />
                                                    : null
                                                }
                                                {symbol?.symbol.name}
                                            </Badge>
                                        </Link>
                                    ))}
                                </CardContent>
                            ) : null}

                            <CardFooter>
                                <p className="text-muted-foreground">
                                    {formatDate(item.news.published * 1000)} - {item.news.source}
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    )
}