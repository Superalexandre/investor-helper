import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// import { cn } from "@/lib/utils"
import { getNewsById } from "@/utils/getNews"
import type { GroupedNews } from "@/utils/getNews"
import type { MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, Link, redirect, useLoaderData } from "@remix-run/react"
import { MdArrowBack } from "react-icons/md"
import { NewsArticle } from "../../../../../db/schema/news"
import { cn } from "@/lib/utils"

export async function loader({
    params,
}: ClientLoaderFunctionArgs) {
    const { id } = params

    // Redirect to the news page if the id is not provided
    if (!id) return redirect("/news")

    const news = await getNewsById({ id })

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

    const newsData = news[0]

    return (
        <div className="relative flex w-full flex-col items-center">
            <Button asChild variant="default">
                <Link to="/news" className="left-0 top-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute">
                    <MdArrowBack className="size-6" />

                    Retour
                </Link>
            </Button>

            <div className="px-8 lg:w-3/4">
                <div className="flex flex-col items-center justify-center pb-8">
                    <p className="pt-4 text-center text-2xl font-bold">{newsData.news.title}</p>

                    <p className="text-muted-foreground text-center">{formatDateTime(newsData.news.published * 1000)}</p>
                </div>

                <div className="flex flex-col">
                    <div className="flex flex-col justify-between gap-8">
                        <ConvertHtmlToReact
                            json={newsData.newsArticle.jsonDescription}
                            newsData={newsData}
                        />
                    </div>

                    <div className="my-10">
                        <p className="text-muted-foreground">Source : {newsData.newsArticle.copyright || newsData.news.source}</p>
                    </div>
                </div>
            </div>
        </div >
    )
}

function ConvertHtmlToReact({ json, newsData }: { json: string, newsData: GroupedNews<NewsArticle> }) {
    const convertedJson = JSON.parse(json)

    const Component = []

    if (convertedJson.children) {
        Component.push(GetDeepComponent(convertedJson.children, newsData))
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
function GetDeepComponent(children: any, data: GroupedNews<NewsArticle>, { className, rawText }: Params = {}) {
    const Component = []

    for (const child of children) {
        if (child.type === "news-image") {
            console.log(child.params.image)
            /*
            source-height
: 
555
source-width
: 
1024*/

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
                const logoId = data.relatedSymbols?.find(symbol => symbol?.symbolId === child.params?.symbol)?.logoid

                Component.push(
                    <Link to={`/stocks/${child.params?.symbol}`} key={`${child.params?.symbol}-${Component.length}`} className={className?.badge}>
                        <Badge
                            variant="default"
                            className="flex h-8 flex-row items-center justify-center"
                        >
                            {logoId ?
                                <img
                                    id={child.params?.symbol}
                                    src={"https://s3-symbol-logo.tradingview.com/" + logoId + ".svg"}
                                    alt={child.params?.symbol}
                                    className="mr-1.5 size-6 rounded-full"
                                />
                                : null
                            }
                            {child.params?.symbol}
                        </Badge>
                    </Link>
                )
            } else if (["b", "p", "i"].includes(child?.type)) {
                const ComponentResult = GetDeepComponent(child.children, data, {
                    className: {
                        badge: "inline-block align-middle",
                        image: "mx-auto",
                    },
                    rawText: true
                })

                Component.push(
                    <p 
                        
                        key={`${child.type}-${Component.length}-${child.children.length}`}
                    >
                        {ComponentResult}
                    </p>
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