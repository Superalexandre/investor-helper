import { Badge } from "@/components/ui/badge"
import { getNewsById } from "@/utils/news"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
import { NewsRelatedSymbol } from "../../../../../db/schema/news"
import { cn } from "@/lib/utils"
import { Symbol } from "@/schema/symbols"
import SymbolLogo from "@/components/symbolLogo"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { normalizeSymbol } from "@/utils/normalizeSymbol"
import { ScrollTop } from "@/components/scrollTop"
import BackButton from "@/components/backButton"

export async function loader({
    params,
}: LoaderFunctionArgs) {
    const { id } = params

    // Redirect to the news page if the id is not provided
    if (!id) return redirect("/news")

    const { news, relatedSymbols } = await getNewsById({ id })

    if (!news) return redirect("/news")

    return {
        news,
        relatedSymbols
    }
}

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
    const title = "Investor Helper - Les actualités"
    const description = data?.news.news.title ?? ""

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: `https://investor-helper.com/news/${params.id}` },
    ]
}

export default function Index() {
    const { news, relatedSymbols } = useLoaderData<typeof loader>()

    return (
        <div className="relative flex w-full flex-col items-center overflow-hidden">
            <ScrollTop showBelow={250} />

            <BackButton />

            <div className="w-full px-4 lg:w-3/4">
                <div className="flex flex-col items-center justify-center pb-8">
                    <h1 className="pt-4 text-center text-2xl font-bold">{news.news.title}</h1>

                    <p className="text-muted-foreground text-center">{formatDateTime(news.news.published * 1000)}</p>
                </div>

                <div className="flex flex-col">
                    <div className="flex flex-col justify-between gap-8">
                        <ConvertHtmlToReact
                            json={news.news_article.jsonDescription}
                            relatedSymbols={relatedSymbols}
                            newsId={news.news.id}
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

function ConvertHtmlToReact({ json, relatedSymbols, newsId }: { json: string, relatedSymbols: FullSymbol[], newsId: string }) {
    const convertedJson = JSON.parse(json)

    const Component = []

    if (convertedJson.children) {
        Component.push(GetDeepComponent(convertedJson.children, relatedSymbols, newsId))
    }

    return Component
}

interface Params {
    className?: {
        [key: string]: string
    },
    rawText?: boolean
    type?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GetDeepComponent(children: any, relatedSymbols: FullSymbol[], newsId: string, { className, rawText, type }: Params = {}) {
    const Component = []

    const configClassName = {
        badge: "inline-block align-middle",
        image: "mx-auto",
        text: "inline-block",
        bold: "font-bold",
        italic: "italic",
        parent: "inline-block"
    }

    for (const child of children) {
        if (child.type === "news-image") {
            Component.push(
                <img
                    key={child.params.image.id}
                    width={child.params.image["source-width"]}
                    height={child.params.image["source-height"]}
                    className={cn("mx-auto", className?.image)}
                    src={`/api/image/news?name=${child.params.image.id}`}
                    alt={child.params.image.alt ?? ""}
                />
            )

            continue
        }

        if (typeof child === "string") {
            // Replace useless "(link)" that the text can contain
            let replacedChild = child
            if (child.match(/\(link\)/g)) replacedChild = child.replace(/\(link\)/g, "")

            if (rawText) {
                Component.push(replacedChild)

                continue
            }

            const additionalClassName = []

            if (type && type === "bold") additionalClassName.push("font-bold")
            if (type && type === "italic") additionalClassName.push("italic")

            Component.push(
                <p 
                    className={cn(className?.text, additionalClassName)}
                >
                    {replacedChild}
                </p>
            )

            continue
        }

        if (typeof child === "object") {
            if (["symbol"].includes(child?.type)) {
                const relatedSymbolsData = relatedSymbols.find(({ symbol }) => symbol.symbolId === child.params?.symbol)
                const symbolLink = normalizeSymbol(child.params?.symbol)

                Component.push(
                    <Link
                        to={{
                            pathname: `/data/${symbolLink}`
                        }}
                        state={{
                            redirect: `/news/${newsId}`,
                        }}
                        key={`${child.params?.symbol}-${Component.length}`}
                        className={className?.badge}
                    >
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
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true,
                    type: child.type
                })

                Component.push(
                    <div
                        key={`${child.type}-${Component.length}-${child.children.length}`}
                        className={cn(className?.parent)}
                    >
                        {ComponentResult}
                    </div>
                )
            } else if (["quote"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <blockquote key={`${child.type}-${Component.length}-${child.children.length}`} className="border-muted-foreground border-l-2 pl-4">
                        {ComponentResult}
                    </blockquote>
                )

            } else if (["url"].includes(child?.type)) {
                Component.push(
                    <Link
                        key={`${child.type}-${Component.length}`}
                        to={child.params.url}
                        className="text-muted-foreground inline-block hover:text-white hover:underline"
                    >
                        {child.params.linkText}
                    </Link>
                )
            } else if (["list"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <ul key={`${child.type}-${Component.length}-${child.children.length}`}>
                        {ComponentResult}
                    </ul>
                )
            } else if (["*"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <li key={`${child.type}-${Component.length}-${child.children.length}`} className="flex flex-row items-center">
                        {ComponentResult}
                    </li>
                )
            } else if (["table"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <Table key={`${child.type}-${Component.length}-${child.children.length}`} className="table-auto">
                        {ComponentResult}
                    </Table>
                )
            } else if (["table-body"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <TableBody key={`${child.type}-${Component.length}-${child.children.length}`}>
                        {ComponentResult}
                    </TableBody>
                )
            } else if (["table-header"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <TableHeader key={`${child.type}-${Component.length}-${child.children.length}`}>
                        {ComponentResult}
                    </TableHeader>
                )
            } else if (["table-header-cell"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <TableHead key={`${child.type}-${Component.length}-${child.children.length}`}>
                        {ComponentResult}
                    </TableHead>
                )
            } else if (["tr", "table-row"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <TableRow key={`${child.type}-${Component.length}-${child.children.length}`}>
                        {ComponentResult}
                    </TableRow>
                )
            } else if (["table-data-cell"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
                    className: configClassName,
                    rawText: true
                })

                Component.push(
                    <TableCell key={`${child.type}-${Component.length}-${child.children.length}`}>
                        {ComponentResult}
                    </TableCell>
                )
            } else {
                console.error("Unknown child", child, newsId)
            }

            continue
        }

        console.error("Unknown type", child, newsId)
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