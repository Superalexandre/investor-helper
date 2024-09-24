import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getNewsById } from "@/utils/news"
import type { MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, Link, redirect, useLoaderData } from "@remix-run/react"
import { MdArrowBack } from "react-icons/md"
import { NewsRelatedSymbol } from "../../../../../db/schema/news"
import { cn } from "@/lib/utils"
import { Symbol } from "@/schema/symbols"
import SymbolLogo from "@/components/symbolLogo"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

export async function loader({
    params,
}: ClientLoaderFunctionArgs) {
    const { id } = params

    // Redirect to the news page if the id is not provided
    if (!id) return redirect("/news")

    const { news, relatedSymbols } = await getNewsById({ id })

    return {
        news,
        relatedSymbols
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "Investor Helper - Actualité" },
        // { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const { news, relatedSymbols } = useLoaderData<typeof loader>()

    return (
        <div className="relative flex w-full flex-col items-center overflow-hidden">
            <div className="w-full">
                <Button asChild variant="default">
                    <Link
                        to={{
                            pathname: "/news",
                            hash: news.news.id
                        }}
                        className="left-0 top-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
                    >
                        <MdArrowBack className="size-6" />

                        Retour
                    </Link>
                </Button>
            </div>

            <div className="px-8 lg:w-3/4">
                <div className="flex flex-col items-center justify-center pb-8">
                    <p className="pt-4 text-center text-2xl font-bold">{news.news.title}</p>

                    <p className="text-muted-foreground text-center">{formatDateTime(news.news.published * 1000)}</p>
                </div>

                <div className="flex flex-col">
                    <div className="flex flex-col justify-between gap-8">
                        <ConvertHtmlToReact
                            json={news.news_article.jsonDescription}
                            relatedSymbols={relatedSymbols}
                        />
                    </div>

                    <div className="my-10">
                        <p className="text-muted-foreground">Source : {news.news_article.copyright || news.news.source}</p>
                    </div>
                </div>
            </div>
        </div >
    )
}

interface FullSymbol {
    symbol: Symbol
    news_related_symbol: NewsRelatedSymbol
}

function ConvertHtmlToReact({ json, relatedSymbols }: { json: string, relatedSymbols: FullSymbol[] }) {
    const convertedJson = JSON.parse(json)

    const Component = []

    if (convertedJson.children) {
        Component.push(GetDeepComponent(convertedJson.children, relatedSymbols))
    }

    return Component
}

interface Params {
    className?: {
        [key: string]: string
    },
    rawText?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GetDeepComponent(children: any, relatedSymbols: FullSymbol[], { className, rawText }: Params = {}) {
    const Component = []

    for (const child of children) {
        if (child.type === "news-image") {
            Component.push(
                <img
                    width={child.params.image["source-width"]}
                    height={child.params.image["source-height"]}
                    className={cn("mx-auto", className?.image)}
                    src={`https://s3.tradingview.com/news/image/${child.params.image.id}-resized.jpeg`}
                    alt={child.params.image.alt ?? ""}
                />
            )

            continue
        }

        if (typeof child === "string") {

            if (rawText) {
                Component.push(child)

                continue
            }

            Component.push(
                <p className={className?.text}>{child}</p>
            )

            continue
        }

        if (typeof child === "object") {
            if (["symbol"].includes(child?.type)) {
                const relatedSymbolsData = relatedSymbols.find(({ symbol }) => symbol.symbolId === child.params?.symbol)

                Component.push(
                    <Link to={`/data/${child.params?.symbol}`} key={`${child.params?.symbol}-${Component.length}`} className={className?.badge}>
                        <Badge
                            variant="default"
                            className="flex h-8 flex-row items-center justify-center"
                        >
                            <SymbolLogo
                                symbol={relatedSymbolsData?.symbol}
                                className="mr-1.5 size-6 rounded-full"
                            />

                            <span>
                                {child.params?.symbol}
                            </span>
                        </Badge>
                    </Link>
                )
            } else if (["b", "p", "i"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                    },
                    rawText: true
                })

                Component.push(
                    <div
                        key={`${child.type}-${Component.length}-${child.children.length}`}
                    >
                        {ComponentResult}
                    </div>
                )

            } else if (["url"].includes(child?.type)) {
                Component.push(
                    <Link
                        to={child.params.url}
                        className="text-muted-foreground inline-block hover:text-white hover:underline"
                    >
                        {child.params.linkText}
                    </Link>
                )
            } else if (["list"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                    },
                    rawText: true
                })

                Component.push(
                    <ul key={`${child.type}-${Component.length}`}>
                        {ComponentResult}
                    </ul>
                )
            } else if (["*"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                        text: "inline-block"
                    },
                    rawText: true
                })

                Component.push(
                    <li key={`${child.type}-${Component.length}`} className="flex flex-row items-center">
                        {ComponentResult}
                    </li>
                )
            } else if (["table"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                        text: "inline-block"
                    },
                    rawText: true
                })

                Component.push(
                    <Table key={`${child.type}-${Component.length}`} className="table-auto">
                        {ComponentResult}
                    </Table>
                )
            } else if (["table-body"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                        text: "inline-block"
                    },
                    rawText: true
                })

                Component.push(
                    <TableBody key={`${child.type}-${Component.length}`}>
                        {ComponentResult}
                    </TableBody>
                )
            } else if (["tr", "table-row"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                        text: "inline-block"
                    },
                    rawText: true
                })

                Component.push(
                    <TableRow key={`${child.type}-${Component.length}`}>
                        {ComponentResult}
                    </TableRow>
                )
            } else if (["table-data-cell"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                        text: "inline-block"
                    },
                    rawText: true
                })

                Component.push(
                    <TableCell key={`${child.type}-${Component.length}`}>
                        {ComponentResult}
                    </TableCell>
                )
            } else {
                console.error("Unknown child", child)
            }

            continue
        }

        console.error("Unknown type", child)
    }

    return Component
}

function formatDateTime(date: string | number) {
    return new Date(date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short"
    })
}