import { getNewsById } from "@/utils/news"
import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { redirect, useLoaderData } from "@remix-run/react"
import { ScrollTop } from "@/components/scrollTop"
import BackButton from "@/components/button/backButton"
import { Button } from "../../../components/ui/button"
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
import { EllipsisVerticalIcon } from "lucide-react"
import { ConvertJsonToReact, ConvertNewsToReact } from "../../../components/parseComponent"
import type { ReactNode } from "react"

export const loader: LoaderFunction = async({ request, params }) => {
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
			tagName: "link", rel: "canonical", href: `https://www.investor-helper.com/news/${params.id}`
		},
		{ name: "robots", content: "noindex" }
	]
}

export const handle = {
	i18n: "newsId"
}

export default function Index(): ReactNode {
	const { t, i18n } = useTranslation("newsId")
	const { news, relatedSymbols } = useLoaderData<typeof loader>()

	return (
		<div className="relative flex w-full flex-col items-center overflow-hidden">
			<ScrollTop showBelow={250} />

			<div className="flex w-full flex-row items-center justify-evenly">
				<BackButton fallbackRedirect="/news" label={t("back")} />

				<div className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute">
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true} name="More options" aria-label="More options">
							<Button variant="ghost">
								<EllipsisVerticalIcon className="size-6" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mx-4">
							<DropdownMenuItem asChild={true} className="p-0">
								<CopyButton
									content={`https://www.investor-helper.com/news/${news.news.id}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
							<DropdownMenuItem asChild={true} className="p-0">
								<ShareButton
									title={news.news.title}
									text={news.news_article.shortDescription || news.news.title}
									url={`https://www.investor-helper.com/news/${news.news.id}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="w-full px-4 md:w-1/2">
				<div className="flex flex-col items-center justify-center pb-8">
					<h1 className="pt-4 text-center font-bold text-2xl">{news.news.title}</h1>

					<p className="text-center text-muted-foreground">
						{formatDateTime(news.news.published * 1000, i18n.language)}
					</p>
				</div>

				<div className="flex flex-col">
					<div className="flex flex-col justify-between gap-8">
						<ConvertNewsToReact
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

function formatDateTime(date: string | number, locale: string): string {
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
