import { Badge } from "@/components/ui/badge"
import { getNewsById } from "@/utils/news"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
import type { NewsRelatedSymbol } from "../../../../../db/schema/news"
import { cn } from "@/lib/utils"
import type { Symbol as SymbolType } from "@/schema/symbols"
import SymbolLogo from "@/components/symbolLogo"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { normalizeSymbol } from "@/utils/normalizeSymbol"
import { ScrollTop } from "@/components/scrollTop"
import BackButton from "@/components/button/backButton"
import type { JSX } from "react"
import { Button } from "../../../components/ui/button"
import { MdMoreVert } from "react-icons/md"
import ShareButton from "../../../components/button/shareButton"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "../../../components/ui/dropdown-menu"
import CopyButton from "../../../components/button/copyButton"
import { useTranslation } from "react-i18next"
import i18next from "../../../i18next.server"

export async function loader({ request, params }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "newsId")
	const { id } = params

	// Redirect to the news page if the id is not provided
	if (!id) {
		return redirect("/news")
	}

	const { news, relatedSymbols } = await getNewsById({ id })

	if (!news) {
		return redirect("/news")
	}

	const title = t("title")

	return {
		news,
		relatedSymbols,
		title
	}
}

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
	const title = data?.title ?? ""
	const description = data?.news.news.title ?? ""

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			name: "canonical",
			content: `https://www.investor-helper.com/news/${params.id}`
		},
		{ name: "robots", content: "noindex" }
	]
}

export const handle = {
	i18n: "newsId"
}

export default function Index() {
	const { t, i18n } = useTranslation("newsId")
	const { news, relatedSymbols } = useLoaderData<typeof loader>()

	return (
		<div className="relative flex w-full flex-col items-center overflow-hidden">
			<ScrollTop showBelow={250} />

			<div className="flex w-full flex-row items-center justify-evenly">
				<BackButton fallbackRedirect="/news" label={t("back")} />

				<div className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute">
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button variant="ghost">
								<MdMoreVert className="size-6" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mx-4">
							<DropdownMenuItem asChild={true} className="p-0">
								<CopyButton
									content={`https://investor-helper.com/news/${news.news.id}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
							<DropdownMenuItem asChild={true} className="p-0">
								<ShareButton
									title={news.news.title}
									text={news.news_article.shortDescription || news.news.title}
									url={`https://investor-helper.com/news/${news.news.id}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="w-full px-4 lg:w-3/4">
				<div className="flex flex-col items-center justify-center pb-8">
					<h1 className="pt-4 text-center font-bold text-2xl">{news.news.title}</h1>

					<p className="text-center text-muted-foreground">
						{formatDateTime(news.news.published * 1000, i18n.language)}
					</p>
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
						<p className="text-muted-foreground">
							{t("source")} : {news.news_article.copyright || news.news.source}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}

interface FullSymbol {
	symbol: SymbolType
	// biome-ignore lint/style/useNamingConvention: Result API TODO: Rename
	news_related_symbol: NewsRelatedSymbol
}

function ConvertHtmlToReact({
	json,
	relatedSymbols,
	newsId
}: { json: string; relatedSymbols: FullSymbol[]; newsId: string }) {
	const convertedJson = JSON.parse(json)

	const Component: (string | JSX.Element)[] = []

	if (convertedJson.children) {
		const result = GetDeepComponent(convertedJson.children, relatedSymbols, newsId)

		Component.push(...result)
	}

	return Component
}

interface Params {
	className?: {
		[key: string]: string
	}
	rawText?: boolean
	type?: string
	activeId?: string
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity:
function GetDeepComponent(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	children: any,
	relatedSymbols: FullSymbol[],
	newsId: string,
	{ className, rawText, type, activeId }: Params = {}
) {
	const Component: Array<JSX.Element | string> = []

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
				const relatedSymbolsData = relatedSymbols.find(({ symbol }) => symbol.symbolId === child.params?.symbol)
				const symbolLink = normalizeSymbol(child.params?.symbol)

				Component.push(
					<Link
						to={{
							pathname: `/data/${symbolLink}`
						}}
						state={{
							redirect: `/news/${newsId}`,
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
				const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
					className: configClassName,
					rawText: true,
					type: child.type,
					activeId: `section-${Component.length}`
				})

				Component.push(
					<div
						key={`${child.type}-${Component.length}-${child.children.length}`}
						id={`section-${Component.length}`}
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
					<blockquote
						key={`${child.type}-${Component.length}-${child.children.length}`}
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
				const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
					className: configClassName,
					rawText: true
				})

				Component.push(
					<ul key={`${child.type}-${Component.length}-${child.children.length}`}>{ComponentResult}</ul>
				)
			} else if (["*"].includes(child?.type)) {
				const ComponentResult = GetDeepComponent(child.children, relatedSymbols, newsId, {
					className: configClassName,
					rawText: true
				})

				Component.push(
					<li
						key={`${child.type}-${Component.length}-${child.children.length}`}
						className="flex flex-row items-center"
					>
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

function formatDateTime(date: string | number, locale: string) {
	return new Date(date).toLocaleDateString(locale, {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "numeric",
		minute: "numeric",
		timeZoneName: "short"
	})
}
