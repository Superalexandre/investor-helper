import { Link, useParams } from "@remix-run/react"
import { ScrollTop } from "../../../../components/scrollTop"
import { useQuery } from "@tanstack/react-query"
import type { NewsSymbolsChildArticle } from "../../../../../types/News"
import SkeletonNews from "../../../../components/skeletons/skeletonNews"
import ImportanceBadge from "../../../../components/importanceBadge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../../components/ui/card"
import formatDate from "../../../../../utils/formatDate"
import DisplaySymbols from "../../../../components/displaySymbols"
import BackButton from "../../../../components/button/backButton"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { useTranslation } from "react-i18next"
import i18next from "../../../../i18next.server"
import { DotSeparator } from "../../../../components/ui/separator"

export async function loader({ request }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "newsFocus")

	const title = t("title")
	const description = t("description")

	return {
		title: title,
		description: description
	}
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	if (!data) {
		return []
	}

	const { title, description } = data

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			tagName: "link", rel: "canonical", href: `https://www.investor-helper.com/focus/${params.id}`
		},
		{ name: "robots", content: "noindex" }
	]
}

export const handle = {
	i18n: "newsFocus"
}

export default function Index() {
	const { t, i18n } = useTranslation("newsFocus")
	const { id } = useParams()

	const {
		data: news,
		isPending,
		error
	} = useQuery<NewsSymbolsChildArticle[]>({
		queryKey: ["news", id],
		queryFn: async () => {
			const req = await fetch(`/api/news/multiple?id=${id}`)
			const json = await req.json()

			// console.log(json)

			return json
		},
		refetchOnWindowFocus: true
	})

	if (isPending) {
		const skeletonArray = Array.from({ length: 10 })

		return (
			<div>
				<div className="flex flex-col items-center justify-center space-y-4">
					<p className="pt-4 text-center font-bold text-2xl">{t("couldBeInteresting")}</p>
				</div>
				<div className="flex flex-col space-y-6 p-4 lg:p-10">
					{skeletonArray.map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<SkeletonNews key={index} />
					))}
				</div>
			</div>
		)
	}

	if (error) {
		throw error
	}

	return (
		<div className="relative w-full overflow-hidden">
			<BackButton fallbackRedirect="/news" label={t("seeAllNews")} />

			<ScrollTop showBelow={250} />

			<div className="flex flex-col items-center justify-center space-y-4">
				<p className="pt-4 text-center font-bold text-2xl">{t("couldBeInteresting")}</p>

				{/* <Button variant="default">
                    Rafraîchir
                </Button> */}
			</div>

			<div className="flex flex-col space-y-6 p-4 lg:p-10">
				{news.length > 0 ? (
					news.map(({ news, relatedSymbols }) => (
						<div className="relative" key={news.news.id} id={news.news.id}>
							{news.news.importanceScore > 50 ? (
								<ImportanceBadge
									starNumber={Math.floor(news.news.importanceScore / 50)}
									className="-right-[10px] -top-[10px] absolute"
								/>
							) : null}

							<Card>
								<Link
									to={{
										pathname: `/news/${news.news.id}`
									}}
									state={{
										redirect: `/news/focus/${id}`,
										hash: news.news.id
									}}
								>
									<CardHeader>
										<CardTitle>{news.news.title}</CardTitle>
									</CardHeader>
								</Link>

								<CardContent>
									<DisplaySymbols
										symbolList={relatedSymbols}
										hash={news.news.id}
										redirect={`/news/focus/${id}`}
										t={t}
									/>
								</CardContent>


								<CardFooter className="flex flex-col flex-wrap justify-start gap-1 text-muted-foreground lg:flex-row lg:items-center lg:gap-2">
									<span className="w-full lg:w-auto">
										{news.news.source}
									</span>

									<DotSeparator className="hidden lg:block" />

									<span className="w-full lg:w-auto">
										{new Date(news.news.published * 1000 * 1000 || "").toLocaleDateString(i18n.language, {
											hour: "numeric",
											minute: "numeric",
											year: "numeric",
											month: "long",
											day: "numeric",
											timeZoneName: "shortOffset",
											weekday: "long"
										})}
									</span>
								</CardFooter>

								{/* <CardFooter>
									<p className="text-muted-foreground">
										{formatDate(news.news.published * 1000, {
											locale: i18n.language
										})}
										- {news.news.source}
									</p>
								</CardFooter> */}
							</Card>
						</div>
					))
				) : (
					<p className="text-center font-bold text-lg">{t("noNews")}</p>
				)}
			</div>
		</div>
	)
}
