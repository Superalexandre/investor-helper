import type { MetaFunction } from "@remix-run/node"
import type { FullNews } from "@/utils/news"
import { Link, useLocation } from "@remix-run/react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
// import { MdPriorityHigh } from "react-icons/md"
import formatDate from "@/utils/formatDate"
import SymbolLogo from "@/components/symbolLogo"
import type { NewsRelatedSymbol } from "@/schema/news"
import type { Symbol as SymbolType } from "@/schema/symbols"
import { useState } from "react"
import { normalizeSymbol } from "@/utils/normalizeSymbol"
import { ScrollTop } from "@/components/scrollTop"
import { Button } from "@/components/ui/button"
import { MdArrowBack, MdArrowForward } from "react-icons/md"
import ImportanceBadge from "@/components/importanceBadge"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "../../../components/ui/skeleton"

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Les actualités"
	const description =
		"Découvrez l'actualité économique du moment sur Investor Helper. Suivez en direct les nouvelles financières mondiales, les tendances des marchés boursiers, ainsi que les analyses approfondies sur l'économie. Que vous soyez investisseur ou passionné de finance, restez à jour avec les informations essentielles qui impactent les marchés et vos investissements."

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://investor-helper.com/news" }
	]
}

export default function Index() {
	const location = useLocation()
	
	const actualPage = location.search ? Number.parseInt(new URLSearchParams(location.search).get("page") || "1") : 1

	const previousPage = location.search && actualPage - 1 >= 1 ? actualPage - 1 : 1
	const nextPage = location.search ? actualPage + 1 : 2

	const {
		data: news,
		isPending,
		error
	} = useQuery<FullNews[]>({
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
		refetchOnWindowFocus: true,
	})

	if (isPending) {
		const skeletonArray = Array.from({ length: 10 })

		return (
			<div>
				<div className="flex flex-col items-center justify-center space-y-4">
					<p className="pt-4 text-center font-bold text-2xl">Dernières actualités</p>
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

	if (!news || news.length <= 0) {
		return <Empty />
	}

	return (
		<div>
			<ScrollTop showBelow={250} />

			<div className="flex flex-col items-center justify-center space-y-4">
				<p className="pt-4 text-center font-bold text-2xl">Dernières actualités</p>

				{/* <Button variant="default">
                    Rafraîchir
                </Button> */}
			</div>

			<div className="flex flex-col space-y-6 p-4 lg:p-10">
				{news.map((item) => (
					<div className="relative" key={item.news.id} id={item.news.id}>
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
									hash: item.news.id
								}}
							>
								<CardHeader>
									<CardTitle>{item.news.title}</CardTitle>
								</CardHeader>
							</Link>

							<CardContent>
								<DisplaySymbols symbolList={item.relatedSymbols} hash={item.news.id} />
							</CardContent>

							<CardFooter>
								<p className="text-muted-foreground">
									{formatDate(item.news.published * 1000)} - {item.news.source} (via
									{item.news.mainSource})
								</p>
							</CardFooter>
						</Card>
					</div>
				))}
			</div>

			<div className="flex flex-row items-center justify-center gap-4 pb-4">
				<Link
					to={{
						pathname: "/news",
						search: `?page=${previousPage}`
					}}
				>
					<Button
						variant="default"
						className="flex flex-row content-center items-center justify-center gap-2"
					>
						<MdArrowBack className="size-5" />
						Page précédente
					</Button>
				</Link>

				<Link
					to={{
						pathname: "/news",
						search: `?page=${nextPage}`
					}}
				>
					<Button
						variant="default"
						className="flex flex-row content-center items-center justify-center gap-2"
					>
						Page suivante
						<MdArrowForward className="size-5" />
					</Button>
				</Link>
			</div>
		</div>
	)
}

function Empty() {
	return (
		<div className="flex flex-col items-center justify-center space-y-4">
			<p className="pt-4 text-center font-bold text-2xl">Dernières actualités</p>

			<p className="text-center text-lg">Aucune actualité pour le moment</p>

			<Link to="/news">
				<Button variant="default">Retourner à la première page</Button>
			</Link>
		</div>
	)
}

interface FullSymbol {
	symbol: SymbolType
	// biome-ignore lint/style/useNamingConvention: <explanation>
	news_related_symbol: NewsRelatedSymbol
}

function DisplaySymbols({
	symbolList,
	hash
}: {
	symbolList: FullSymbol[]
	hash?: string
}) {
	const [viewAll, setViewAll] = useState(false)

	if (!symbolList || symbolList.length <= 0) {
		return null
	}

	const symbolCount = symbolList.length

	const displaySymbols = viewAll ? symbolList : symbolList.slice(0, 5)

	return (
		<div className="flex flex-row flex-wrap items-center gap-1.5">
			{displaySymbols.map((symbol) => (
				<Link
					to={{
						pathname: `/data/${normalizeSymbol(symbol.symbol.symbolId)}`
					}}
					state={{
						redirect: "/news",
						hash: hash
					}}
					key={symbol.symbol.symbolId}
				>
					<Badge
						key={symbol.symbol.symbolId}
						variant="default"
						className="flex h-8 flex-row items-center justify-center"
					>
						<SymbolLogo symbol={symbol.symbol} className="mr-1.5 size-6 rounded-full" />

						{symbol.symbol.name}
					</Badge>
				</Link>
			))}

			{symbolList.length > 5 && !viewAll ? (
				<Badge
					variant="default"
					className="flex h-8 flex-row items-center justify-center hover:cursor-pointer"
					onClick={() => setViewAll(true)}
				>
					Voir tout ({symbolCount})
				</Badge>
			) : null}
			{symbolList.length > 5 && viewAll ? (
				<Badge
					variant="default"
					className="flex h-8 flex-row items-center justify-center hover:cursor-pointer"
					onClick={() => setViewAll(false)}
				>
					Réduire
				</Badge>
			) : null}
		</div>
	)
}

function SkeletonNews() {
	const random = Math.floor(Math.random() * 15) + 1
	const badgeArray = Array.from({ length: random })

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Skeleton className="h-4 w-1/4" />
				</CardTitle>
			</CardHeader>

			<CardContent>
				<div className="flex flex-row flex-wrap items-center gap-1.5">
					{badgeArray.map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<Skeleton className="h-8 w-24 rounded-md" key={index} />
					))}
				</div>
			</CardContent>

			<CardFooter className="flex flex-col items-center justify-start gap-1 lg:flex-row lg:gap-2">
				<Skeleton className="h-4 w-1/2" />
			</CardFooter>
		</Card>
	)
}
