import { cn } from "../lib/utils"
import { Link } from "@remix-run/react"
import { Badge } from "./ui/badge"
import SymbolLogo from "./symbolLogo"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import type { JSX } from "react"
import type { NewsRelatedSymbol } from "../../../db/schema/news"
import { normalizeSymbol } from "../../utils/normalizeSymbol"
import type { Symbol as SymbolType } from "@/schema/symbols"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { ClockIcon } from "lucide-react"
import { format, fromZonedTime } from 'date-fns-tz';
import { parse } from "date-fns"
// import { format } from 'date-fns';

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
    textClassName
}: { json: string, textClassName?: string }): (string | JSX.Element)[] {
    if (!json) {
        return []
    }

    const convertedJson = JSON.parse(json)

    const Component: (string | JSX.Element)[] = []

    if (convertedJson?.children) {
        const result = ParseComponent(convertedJson.children, {
            rawText: true
            // className: {
            //     text: textClassName ?? ""
            // }
        })

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
            const formattedChild = child
                .replace(/\(link\)/g, "")
                .trim()

            const convertedChild = ConvertTimezone(formattedChild)

            if (rawText) {
                Component.push(...convertedChild)

                continue
            }

            const additionalClassName: string[] = []

            if (type && type === "bold") {
                additionalClassName.push("font-bold")
            }
            if (type && type === "italic") {
                additionalClassName.push("italic")
            }

            Component.push(
                <p
                    key={`${formattedChild}-${Component.length}`}
                    className={cn(className?.text, additionalClassName)}
                >
                    {convertedChild}
                </p>
            )

            continue
        }

        if (typeof child === "object") {
            if (["symbol"].includes(child?.type)) {
                const relatedSymbolsData = relatedSymbols?.find(({ symbol }) => symbol.symbolId === child.params?.symbol)
                const symbolLink = normalizeSymbol(child.params?.symbol)

                Component.push(
                    // <Link
                    //     to={{
                    //         pathname: `/data/${symbolLink}`
                    //     }}
                    //     state={{
                    //         // redirect: `/news/${newsId}`,
                    //         hash: activeId ?? undefined
                    //     }}
                    //     key={`${child.params?.symbol}-${Component.length}`}
                    //     className={className?.badge}
                    // >
                    //     <Badge variant="default" className="flex h-8 flex-row items-center justify-center">
                    //         <SymbolLogo
                    //             symbol={relatedSymbolsData?.symbol}
                    //             className="mr-1.5 size-6 rounded-full"
                    //             width={24}
                    //             height={24}
                    //             format="webp"
                    //         />

                    //         <span>{child.params?.symbol}</span>
                    //     </Badge>
                    // </Link>
                    <Link
                        to={{
                            pathname: `/data/${symbolLink}`
                        }}
                        state={{
                            // redirect: `/news/${newsId}`,
                            hash: activeId ?? undefined
                        }}
                        key={`${child.params?.symbol}-${Component.length}`}
                        className={cn("px-2 py-1", className?.badge)}
                    >
                        <Badge variant="outline" className="flex h-6 flex-row items-center justify-center gap-1.5 rounded-full border-card-border">
                            <SymbolLogo
                                symbol={relatedSymbolsData?.symbol}
                                className="size-4 rounded-full"
                                width={24}
                                height={24}
                                format="webp"
                            />

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
                        className="inline-block px-1 text-muted-foreground hover:text-white hover:underline"
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
                        className="inline-block"
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
            } else if (["twitter"].includes(child?.type)) {
                const ComponentResult = ParseComponent(child.children, {
                    className: configClassName,
                    rawText: true,
                    relatedSymbols
                })

                // params : {
                //     "url": "https://twitter.com/SenseiBR_btc/status/1885944804942688330",
                //     "username": "SenseiBR_btc",
                //     "name": "Sensei",
                //     "datePublished": "2025-02-02"
                // }

                Component.push(
                    <div key={`${child.type}-${Component.length}-${child.children?.length}`} className="flex flex-col gap-1">
                        <a
                            href={child.params.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            {child.params.name} @{child.params.username}
                        </a>

                        {/* <p className="text-muted-foreground">{child.params.datePublished}</p> */}
                        {ComponentResult}
                    </div>
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

/**
 * Matches time strings in 12-hour (e.g., "10 am EST") or 24-hour format (e.g., "23:59 UTC").
 * - Hours: 1-12 (12-hour) or 00-23 (24-hour).
 * - Minutes: Optional (00-59).
 * - AM/PM: Optional for 12-hour format.
 * - Time zones: EST, ET, CST, PST, UTC, GMT, etc.
 * Flags: Case-insensitive and global.
**/
// const timeRegex = /\b((1[0-2]|0?[1-9]):([0-5][0-9])\s*(am|pm)|([01]?[0-9]|2[0-3])[Hh:]?([0-5][0-9])?)\s*(EST|ET|CST|CT|MST|MT|PST|PT|UTC|GMT)\b/g;
const timeRegex = /\b((1[0-2]|0?[1-9]):([0-5][0-9])\s*(a\.?m\.?|p\.?m\.?)|([01]?[0-9]|2[0-3])[Hh:]?([0-5][0-9])?)\s*(EST|ET|CST|CT|MST|MT|PST|PT|UTC|GMT)\b/g

function ConvertTimezone(text: string): (string | JSX.Element)[] {
    const matches = [...text.matchAll(timeRegex)];

    // Split the text into parts, preserving the time strings
    let lastIndex = 0;
    const parts: string[] = [];

    for (const match of matches) {
        const [fullMatch] = match; // The full matched time string
        const matchIndex = match.index; // The index where the match starts

        // Add the text before the match
        if (matchIndex > lastIndex) {
            parts.push(text.slice(lastIndex, matchIndex));
        }

        // Add the matched time string
        parts.push(fullMatch);

        // Update the last index
        lastIndex = matchIndex + fullMatch.length;
    }

    // Add the remaining text after the last match
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.map((part, index) => {
        if (timeRegex.test(part)) {
            return (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <TooltipProvider key={index}>
                    <Tooltip>
                        <TooltipTrigger asChild={true}>
                            <div className="inline-block">
                                <p className="flex flex-row items-center gap-2">
                                    {part}

                                    <ClockIcon className="text-base" />
                                </p>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <span>
                                {convertToLocalTime(part)}
                            </span>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }

        return part;
    });
}

function convertToLocalTime(timeString: string): string {
    const timeRegex = /\b((1[0-2]|0?[1-9]):([0-5][0-9])\s*(a\.?m\.?|p\.?m\.?)|([01]?[0-9]|2[0-3])[Hh:]?([0-5][0-9])?)\s*(EST|ET|CST|CT|MST|MT|PST|PT|UTC|GMT)\b/g
    const match = timeRegex.exec(timeString);

    if (!match) {
        console.log("Invalid time string", timeString);

        return timeString
    }

    const timeZones: Record<string, string> = {
        // biome-ignore lint/style/useNamingConvention: 
        EST: 'America/New_York',
        // biome-ignore lint/style/useNamingConvention: 
        ET: 'America/New_York',
        // biome-ignore lint/style/useNamingConvention: 
        CST: 'America/Chicago',
        // biome-ignore lint/style/useNamingConvention: 
        CT: 'America/Chicago',
        // biome-ignore lint/style/useNamingConvention: 
        MST: 'America/Denver',
        // biome-ignore lint/style/useNamingConvention: 
        MT: 'America/Denver',
        // biome-ignore lint/style/useNamingConvention: 
        PST: 'America/Los_Angeles',
        // biome-ignore lint/style/useNamingConvention: 
        PT: 'America/Los_Angeles',
        // biome-ignore lint/style/useNamingConvention: 
        UTC: 'UTC',
        // biome-ignore lint/style/useNamingConvention: 
        GMT: 'Etc/GMT',
    };

    const timePart = match[1];
    // const meridian = match[4] || '';
    const timeZoneAbbr = match[7];
    const timeZone = timeZones[timeZoneAbbr];

    // let date: Date;
    // Split timePart with : or h or H
    let [hours, minutes] = timePart.split(/:|h|H/);

    if (!minutes && hours && hours.length === 4) {
        minutes = hours.slice(2);
        hours = hours.slice(0, 2);
    }

    if (hours && minutes && minutes.length > 2) {
        minutes = minutes.split(" ")[0]
    }

    const date = parse(`${hours} ${minutes}`, 'HH mm', new Date());

    const dateTimezone = fromZonedTime(date, timeZone)

    // Check if the date is valid
    if (Number.isNaN(dateTimezone.getTime())) {
        console.log("Invalid date", dateTimezone);

        return timeString
    }

    return format(dateTimezone, "HH:mm zzzz", {
        timeZone: "Europe/Paris"
    });
}