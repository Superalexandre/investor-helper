import type { MetaFunction } from "@remix-run/node"
import { getNews } from "@/utils/news"
import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
// import { MdPriorityHigh } from "react-icons/md"
import formatDate from "@/utils/formatDate"
import SymbolLogo from "@/components/symbolLogo"
import { NewsRelatedSymbol } from "@/schema/news"
import { Symbol } from "@/schema/symbols"
import { useState } from "react"
import { normalizeSymbol } from "@/utils/normalizeSymbol"

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
        // { name: "description", content: "Les dernières actualités du monde de la finance" },
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

            <div className="flex flex-col space-y-6 p-4 lg:p-10">
                {news.map((item) => (
                    <div className="relative" key={item.news.id} id={item.news.id}>
                        {/* <Badge variant="destructive" className="absolute -right-[10px] -top-[10px]">
                            <MdPriorityHigh className="size-5" />
                        </Badge> */}

                        <Card>
                            <Link 
                                to={{
                                    pathname: `/news/${item.news.id}`
                                }}
                                state={{
                                    redirect: "/news",
                                    hash: item.news.id
                                }}
                            >
                                <CardHeader>
                                    <CardTitle>{item.news.title}</CardTitle>
                                </CardHeader>
                            </Link>

                            <CardContent>
                                <DisplaySymbols 
                                    symbolList={item.relatedSymbols} 
                                    hash={item.news.id}
                                />
                            </CardContent>

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

interface FullSymbol {
    symbol: Symbol
    news_related_symbol: NewsRelatedSymbol
}

function DisplaySymbols({
    symbolList,
    hash
}: {
    symbolList: FullSymbol[],
    hash?: string
}) {
    if (!symbolList || symbolList.length <= 0) return null

    const [viewAll, setViewAll] = useState(false)
    const symbolCount = symbolList.length
    
    const displaySymbols = viewAll ? symbolList : symbolList.slice(0, 5)

    return (
        <div className="flex flex-row flex-wrap items-center gap-1.5">
            {displaySymbols.map((symbol) => (
                <Link 
                    to={{
                        pathname: `/data/${normalizeSymbol(symbol.symbol.symbolId)}`,
                    }} 
                    state={{
                        redirect: "/news",
                        hash: hash
                    }}
                    key={symbol.symbol.symbolId}
                >
                    <Badge
                        key={symbol.symbol.symbolId}
                        variant="default"
                        className="flex h-8 flex-row items-center justify-center"
                    >
                        <SymbolLogo
                            symbol={symbol.symbol}
                            className="mr-1.5 size-6 rounded-full"
                        />

                        {symbol.symbol.name}
                    </Badge>
                </Link>
            ))}

            {symbolList.length > 5 && !viewAll ? (
                <Badge
                    variant="default"
                    className="flex h-8 flex-row items-center justify-center hover:cursor-pointer"
                    onClick={() => setViewAll(true)}
                >
                    Voir tout ({symbolCount})
                </Badge>
            ) : symbolList.length > 5 && viewAll ? (
                <Badge
                    variant="default"
                    className="flex h-8 flex-row items-center justify-center hover:cursor-pointer"
                    onClick={() => setViewAll(false)}
                >
                    Réduire
                </Badge>
            ) : null}
        </div>
    )
}