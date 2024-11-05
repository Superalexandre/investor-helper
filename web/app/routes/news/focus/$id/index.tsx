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
import type { MetaFunction } from "@remix-run/node"

// export function loader({ params }: LoaderFunctionArgs) {
// 	const { id } = params

// 	// Redirect to the news page if the id is not provided
// 	if (!id) {
// 		return redirect("/news")
// 	}

//     // Convert the id from base64 to a string
//     //Buffer.from(newsIds).toString("base64url")
//     const decodedId = Buffer.from(id, "base64").toString("utf-8")
//     const articles =

//     console.log(decodedId)

// 	return {
//         true: true
//     }
// }

export const meta: MetaFunction = ({ params }) => {
	const title = "Investor Helper - Les actualités"
	const description = "Les actualités qui pourraient vous intéresser"

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			name: "canonical",
			content: `https://www.investor-helper.com/focus/${params.id}`
		},
		{ name: "robots", content: "noindex" }
	]
}

export default function Index() {
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

			console.log(json)

			return json
		},
		refetchOnWindowFocus: true
	})

	if (isPending) {
		const skeletonArray = Array.from({ length: 10 })

		return (
			<div>
				<div className="flex flex-col items-center justify-center space-y-4">
					<p className="pt-4 text-center font-bold text-2xl">Actualités qui pourraient vous intéresser</p>
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
			<BackButton forceRedirect="/news" label="Voir toutes les actualités" />

			<ScrollTop showBelow={250} />

			<div className="flex flex-col items-center justify-center space-y-4">
				<p className="pt-4 text-center font-bold text-2xl">Actualités qui pourraient vous intéresser</p>

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
									importance={news.news.importanceScore}
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
									/>
								</CardContent>

								<CardFooter>
									<p className="text-muted-foreground">
										{formatDate(news.news.published * 1000)} - {news.news.source} (via
										{news.news.mainSource})
									</p>
								</CardFooter>
							</Card>
						</div>
					))
				) : (
					<p className="text-center font-bold text-lg">Aucune actualité trouvée</p>
				)}
			</div>
		</div>
	)
}
