import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, useLocation } from "@remix-run/react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import formatDate from "@/utils/formatDate"
import { ScrollTop } from "@/components/scrollTop"
import { Button } from "@/components/ui/button"
import { MdArrowBack, MdArrowForward } from "react-icons/md"
import ImportanceBadge from "@/components/importanceBadge"
import { useQuery } from "@tanstack/react-query"
import type { NewsSymbols } from "../../../../types/News"
import SkeletonNews from "../../../components/skeletons/skeletonNews"
import DisplaySymbols from "../../../components/displaySymbols"
import { memo, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import i18next from "../../../i18next.server"

export async function loader({ request }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "news")
	const title = t("title")
	const description = t("description")

	return {
		title: title,
		description: description
	}
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return []
	}

	const { title, description } = data

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://www.investor-helper.com/news" }
	]
}

export const handle = {
	i18n: "news"
}

export default function Index() {
	const { t, i18n } = useTranslation("news")

	const location = useLocation()

	const actualPage = location.search ? Number.parseInt(new URLSearchParams(location.search).get("page") || "1") : 1

	const previousPage = location.search && actualPage - 1 >= 1 ? actualPage - 1 : 1
	const nextPage = location.search ? actualPage + 1 : 2

	return (
		<div>
			<ScrollTop showBelow={250} />

			<div className="flex flex-col items-center justify-center space-y-1 pt-4">
				<p className="text-center font-bold text-2xl">{t("lastNews")}</p>
				{actualPage > 1 ? <p className="text-muted-foreground text-sm">{t("page")} {actualPage}</p> : null}

				{/* <Button variant="default">
                    Rafraîchir
                </Button> */}
			</div>

			<div className="flex flex-col space-y-6 p-4 lg:p-10">
				<News t={t} language={i18n.language} actualPage={actualPage} />
			</div>

			<div className="flex flex-row items-center justify-center gap-4 pb-4">
				<Button
					variant="default"
					className="flex flex-row content-center items-center justify-center gap-2"
					asChild={true}
				>
					<Link
						to={{
							pathname: "/news",
							search: `?page=${previousPage}`
						}}
					>
						<MdArrowBack className="size-5" />
						{t("previousPage")}
					</Link>
				</Button>

				<Button
					variant="default"
					className="flex flex-row content-center items-center justify-center gap-2"
					asChild={true}
				>
					<Link
						to={{
							pathname: "/news",
							search: `?page=${nextPage}`
						}}
					>
						{t("nextPage")}
						<MdArrowForward className="size-5" />
					</Link>
				</Button>
			</div>
		</div>
	)
}

function Empty({
	t
}: {
	t: TFunction
}) {
	return (
		<div className="flex flex-col items-center justify-center space-y-4">
			<p className="pt-4 text-center font-bold text-2xl">{t("lastNews")}</p>

			<p className="text-center text-lg">{t("errors.empty")}</p>

			<Link to="/news">
				<Button variant="default">{t("firstPage")}</Button>
			</Link>
		</div>
	)
}


const News = memo(function News({
	t,
	language,
	actualPage
}: {
	t: TFunction,
	language: string,
	actualPage: number
}) {
	const newsRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

	const {
		data: news,
		isPending,
		error
	} = useQuery<NewsSymbols[]>({
		queryKey: [
			"news",
			{
				page: actualPage
			}
		],
		queryFn: async () => {
			const req = await fetch(`/api/news?page=${actualPage}&limit=20`)
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	useEffect(() => {
		if (location.hash && news && news.length > 0) {
			const newsId = location.hash.replace("#", "")
			const newsRef = newsRefs.current[newsId]

			if (newsRef) {
				newsRef.scrollIntoView({ behavior: "smooth" })
			}
		}
	}, [news])

	if (isPending) {
		const skeletonArray = Array.from({ length: 10 })

		return (
			<div className="flex flex-col space-y-6">
				{skeletonArray.map((_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<SkeletonNews key={index} />
				))}
			</div>
		)
	}

	if (error) {
		throw error
	}

	if (!news || news.length <= 0) {
		return <Empty t={t} />
	}


	return news.map((item) => (
		<div
			className="relative"
			key={item.news.id}
			id={item.news.id}
			ref={(element) => {
				newsRefs.current[item.news.id] = element
			}}
		>
			{item.news.importanceScore > 50 ? (
				<ImportanceBadge
					importance={item.news.importanceScore}
					className="-right-[10px] -top-[10px] absolute"
				/>
			) : null}

			<Card>
				<Link
					to={{
						pathname: `/news/${item.news.id}`
					}}
					state={{
						redirect: "/news",
						hash: item.news.id,
						search: location.search
					}}
				>
					<CardHeader>
						<CardTitle>{item.news.title}</CardTitle>
					</CardHeader>
				</Link>

				<CardContent>
					<DisplaySymbols symbolList={item.relatedSymbols} hash={item.news.id} t={t} />
				</CardContent>

				<CardFooter>
					<p className="flex flex-row flex-wrap items-center gap-1 text-muted-foreground">
						{formatDate(item.news.published * 1000, {
							locale: language
						})} - {item.news.source}
						{/* <span>(via {item.news.mainSource})</span> */}
					</p>
				</CardFooter>
			</Card>
		</div>
	))
})