import React from "react"
import { cn } from "../lib/utils"
import { Link } from "@remix-run/react"
import { Badge } from "./ui/badge"
import SymbolLogo from "./symbolLogo"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import type { JSX } from "react"
import type { NewsRelatedSymbol } from "../../../db/schema/news"
import { normalizeSymbol } from "../../utils/normalizeSymbol"
import type { Symbol as SymbolType } from "@/schema/symbols"

interface Params {
    className?: {
        [key: string]: string
    }
    rawText?: boolean
    type?: string
    activeId?: string
    relatedSymbols?: FullSymbol[]
}

interface FullSymbol {
    symbol: SymbolType
    // biome-ignore lint/style/useNamingConvention: Result API TODO: Rename
    news_related_symbol: NewsRelatedSymbol
}

export function ConvertJsonToReact({
    json,
}: { json: string; }): (string | JSX.Element)[] {
    if (!json) {
        return []
    }

    const convertedJson = JSON.parse(json)

    const Component: (string | JSX.Element)[] = []

    if (convertedJson?.children) {
        const result = ParseComponent(convertedJson.children)

        Component.push(...result)
    }

    return Component
}

export function ConvertNewsToReact({
    json,
    relatedSymbols,
}: { json: string; relatedSymbols: FullSymbol[]; newsId: string }): (string | JSX.Element)[] {
    if (!json) {
        return []
    }

    const convertedJson = JSON.parse(json)

    const Component: (string | JSX.Element)[] = []

    if (convertedJson?.children) {
        const result = ParseComponent(convertedJson.children, { relatedSymbols })

        Component.push(...result)
    }

    return Component
}

export function ParseComponent(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    children: any,
    { className, rawText, type, relatedSymbols, activeId }: Params = {}
): (string | JSX.Element)[] {
    const Component: Array<JSX.Element | string> = []

    const configClassName = {
        badge: "inline-block align-middle",
        image: "mx-auto",
        text: "inline-block",
        bold: "font-bold",
        italic: "italic",
        parent: "inline-block"
    }

    if (!children) {
        return []
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
            if (child.match(/\(link\)/g)) {
                replacedChild = child.replace(/\(link\)/g, "")
            }

            if (rawText) {
                Component.push(replacedChild)

                continue
            }

            const additionalClassName: string[] = []

            if (type && type === "bold") {
                additionalClassName.push("font-bold")
            }
            if (type && type === "italic") {
                additionalClassName.push("italic")
            }

            Component.push(<p className={cn(className?.text, additionalClassName)}>{replacedChild}</p>)

            continue
        }

        if (typeof child === "object") {
            if (["symbol"].includes(child?.type)) {
                const relatedSymbolsData = relatedSymbols?.find(({ symbol }) => symbol.symbolId === child.params?.symbol)
                const symbolLink = normalizeSymbol(child.params?.symbol)

                Component.push(
                    <Link
                        to={{
                            pathname: `/data/${symbolLink}`
                        }}
                        state={{
                            // redirect: `/news/${newsId}`,
                            hash: activeId ?? undefined
                        }}
                        key={`${child.params?.symbol}-${Component.length}`}
                        className={className?.badge}
                    >
                        <Badge variant="default" className="flex h-8 flex-row items-center justify-center">
                            <SymbolLogo symbol={relatedSymbolsData?.symbol} className="mr-1.5 size-6 rounded-full" />

                            <span>{child.params?.symbol}</span>
                        </Badge>
                    </Link>
                )
            } else if (["b", "p", "i"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    type: child.type,
                    activeId: `section-${Component.length}`,
                    relatedSymbols
                })

                Component.push(
                    <div
                        key={`${child.type}-${Component.length}-${child?.children?.length}`}
                        id={`section-${Component.length}`}
                        className={cn(className?.parent)}
                    >
                        {ComponentResult}
                    </div>
                )
            } else if (["quote"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <blockquote
                        key={`${child.type}-${Component.length}-${child.children?.length}`}
                        className="border-muted-foreground border-l-2 pl-4"
                    >
                        {ComponentResult}
                    </blockquote>
                )
            } else if (["url"].includes(child?.type)) {
                Component.push(
                    <Link
                        key={`${child.type}-${Component.length}`}
                        to={child.params.url}
                        className="inline-block text-muted-foreground hover:text-white hover:underline"
                    >
                        {child.params.linkText}
                    </Link>
                )
            } else if (["list"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <ul key={`${child.type}-${Component.length}-${child.children?.length}`}>{ComponentResult}</ul>
                )
            } else if (["*"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child?.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <li
                        key={`${child.type}-${Component.length}-${child.children?.length}`}
                        className="flex flex-row items-center"
                    >
                        {ComponentResult}
                    </li>
                )
            } else if (["table"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <Table key={`${child.type}-${Component.length}-${child.children?.length}`} className="table-auto">
                        {ComponentResult}
                    </Table>
                )
            } else if (["table-body"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <TableBody key={`${child.type}-${Component.length}-${child.children?.length}`}>
                        {ComponentResult}
                    </TableBody>
                )
            } else if (["table-header"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <TableHeader key={`${child.type}-${Component.length}-${child.children?.length}`}>
                        {ComponentResult}
                    </TableHeader>
                )
            } else if (["table-header-cell"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <TableHead key={`${child.type}-${Component.length}-${child.children?.length}`}>
                        {ComponentResult}
                    </TableHead>
                )
            } else if (["tr", "table-row"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <TableRow key={`${child.type}-${Component.length}-${child.children?.length}`}>
                        {ComponentResult}
                    </TableRow>
                )
            } else if (["table-data-cell"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <TableCell key={`${child.type}-${Component.length}-${child.children?.length}`}>
                        {ComponentResult}
                    </TableCell>
                )
            } else if (["pre"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                Component.push(
                    <pre key={`${child.type}-${Component.length}-${child.children?.length}`}>{ComponentResult}</pre>
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