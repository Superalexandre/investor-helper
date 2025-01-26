import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useFetcher, useLoaderData } from "react-router";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { ScrollTop } from "@/components/scrollTop"
import { Button } from "@/components/ui/button"
import ImportanceBadge from "@/components/importanceBadge"
import { useQuery } from "@tanstack/react-query"
import type { NewsFull, NewsSymbols } from "../../../../types/News"
import SkeletonNews from "../../../components/skeletons/skeletonNews"
import DisplaySymbols from "../../../components/displaySymbols"
import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import i18next from "../../../i18next.server"
import { flags } from "../../../i18n"
import { Checkbox } from "../../../components/ui/checkbox"
import { Label } from "../../../components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import type { CheckedState } from "@radix-ui/react-checkbox"
import getNewsPreferences from "../../../lib/getNewsPreferences"
import { getSourceList } from "../../../../utils/news"
import { ArrowLeftIcon, ArrowRightIcon, FilterIcon, GlobeIcon, RssIcon, StarIcon } from "lucide-react"
import { DotSeparator } from "../../../components/ui/separator"

export async function loader({ request }: LoaderFunctionArgs) {
	const [t, newsPreferences] = await Promise.all([
		i18next.getFixedT(request, "news"),
		getNewsPreferences(request)
	])

	// console.log(newsPreferences)

	const allSources = await getSourceList({
		languages: newsPreferences.languages
	})

	const title = t("title")
	const description = t("description")

	return {
		title: title,
		description: description,
		newsPreferences: newsPreferences,
		allSources: allSources
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
		{ tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/news" }
	]
}

export const handle = {
	i18n: "news"
}

export default function Index() {
	const { newsPreferences, allSources } = useLoaderData<typeof loader>()
	const { t, i18n } = useTranslation("news")

	// Memoize the translation function to prevent unstable references
	const memoT = useMemo(() => t, [t])

	const location = useLocation()

	// Memoize URLSearchParams to avoid recalculating on every render
	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

	const actualPage = searchParams ? Number.parseInt(searchParams.get("page") || "1") : 1

	const previousPage = searchParams && actualPage - 1 >= 1 ? actualPage - 1 : 1
	const nextPage = searchParams ? actualPage + 1 : 2

	const [selectedLanguage, setSelectedLanguage] = useState<string[]>(newsPreferences.languages)
	const [selectedImportance, setSelectedImportance] = useState<string[]>(newsPreferences.importances)
	const [selectedSource, setSelectedSource] = useState<string[]>(newsPreferences.sources)

	return (
		<div>
			<ScrollTop showBelow={250} />

			<div className="flex flex-col items-center justify-center space-y-1 pt-4">
				<p className="text-center font-bold text-2xl">{memoT("lastNews")}</p>
				{actualPage > 1 ? (
					<p className="text-muted-foreground text-sm">
						{memoT("page")} {actualPage}
					</p>
				) : null}

				{/* <Button variant="default">
                    Rafraîchir
                </Button> */}
			</div>

			<div className="flex flex-col space-y-6 p-4 lg:p-10">
				<DisplayFilter
					t={memoT}
					selectedLanguage={selectedLanguage}
					setSelectedLanguage={setSelectedLanguage}
					selectedImportance={selectedImportance}
					setSelectedImportance={setSelectedImportance}
					allSources={allSources}
					selectedSource={selectedSource}
					setSelectedSource={setSelectedSource}
				/>

				<News
					t={memoT}
					language={i18n.language}
					actualPage={actualPage}
					selectedLanguage={selectedLanguage}
					selectedImportance={selectedImportance}
					selectedSource={selectedSource}
				/>
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
						rel="prev"
					>
						<ArrowLeftIcon className="size-5" />
						{memoT("previousPage")}
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
						rel="next"
					>
						{memoT("nextPage")}
						<ArrowRightIcon className="size-5" />
					</Link>
				</Button>
			</div>
		</div>
	)
}

const DisplayFilter = memo(function DisplayFilter({
	t,
	selectedLanguage,
	setSelectedLanguage,
	selectedImportance,
	setSelectedImportance,
	allSources,
	selectedSource,
	setSelectedSource
}: {
	t: TFunction
	selectedLanguage: string[]
	setSelectedLanguage: (value: string[]) => void

	selectedImportance: string[]
	setSelectedImportance: (value: string[]) => void

	allSources: string[]
	selectedSource: string[]
	setSelectedSource: (value: string[]) => void
}) {
	const [opened, setOpened] = useState<string | null>(null)

	// Memoized handlers for opening filters
	const handleOpen = useCallback((type: string) => () => setOpened(type), [])
	const handleClose = useCallback(() => setOpened(null), [])

	const commonSources = allSources.filter((source) => selectedSource.includes(source))

	const languageItems = ["fr-FR", "en-US"]
	const languageLabels = { "fr-FR": "Français", "en-US": "Anglais" }

	const importanceItems = ["none", "low", "medium", "high", "very-high"]
	const importanceLabels = {
		"none": <div className="flex flex-row items-center gap-2"><p>Neutre</p></div>,
		"low": <div className="flex flex-row items-center gap-2"><p>Faible</p><ImportanceBadge starNumber={1} /></div>,
		"medium": <div className="flex flex-row items-center gap-2"><p>Moyenne</p><ImportanceBadge starNumber={2} /></div>,
		"high": <div className="flex flex-row items-center gap-2"><p>Forte</p><ImportanceBadge starNumber={3} /></div>,
		"very-high": <div className="flex flex-row items-center gap-2"><p>Très forte</p><ImportanceBadge starNumber={4} /></div>
	}

	const sourceLabels = allSources.reduce((acc, source) => {
		acc[source] = source
		return acc
	}, {} as { [key: string]: string | ReactNode })

	const renderFilterComponent = (isPopup: boolean, type: string, selectedItems: string[], setSelectedItems: (value: string[]) => void, items: string[], labels: { [key: string]: string | ReactNode }) => {
		const child = (
			<FilterComponent
				selectedItems={selectedItems}
				setSelectedItems={setSelectedItems}
				items={items}
				labels={labels}
				type={type}
			/>
		)

		if (!isPopup) {
			return child
		}

		return (
			<PopupFilter open={opened === type} onClose={handleClose}>
				{child}
			</PopupFilter>
		)
	}

	return (
		<>
			{renderFilterComponent(true, "languages", selectedLanguage, setSelectedLanguage, languageItems, languageLabels)}
			{renderFilterComponent(true, "importances", selectedImportance, setSelectedImportance, importanceItems, importanceLabels)}
			{renderFilterComponent(true, "sources", selectedSource, setSelectedSource, allSources, sourceLabels)}

			<PopupFilter open={opened === "all"} onClose={handleClose}>
				<div className="flex flex-col items-center justify-center gap-4">
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-muted-foreground text-sm">Langue</p>
						{renderFilterComponent(false, "languages", selectedLanguage, setSelectedLanguage, languageItems, languageLabels)}
					</div>
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-muted-foreground text-sm">Importance</p>
						{renderFilterComponent(false, "importances", selectedImportance, setSelectedImportance, importanceItems, importanceLabels)}
					</div>
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-muted-foreground text-sm">Sources</p>
						{renderFilterComponent(false, "sources", selectedSource, setSelectedSource, allSources, sourceLabels)}
					</div>
				</div>
			</PopupFilter>

			<div className="flex flex-row items-center gap-2 overflow-x-auto">
				<Button variant={opened === "all" ? "default" : "outline"} onClick={handleOpen("all")} className="flex flex-row items-center gap-2">
					<FilterIcon className="size-5" />

					Tous les filtres
				</Button>
				
				<Button variant={opened === "languages" ? "default" : "outline"} onClick={handleOpen("languages")} className="flex flex-row items-center gap-2">
					<GlobeIcon className="size-5" />

					Langue ({selectedLanguage.length})
				</Button>

				<Button variant={opened === "sources" ? "default" : "outline"} onClick={handleOpen("sources")} className="flex flex-row items-center gap-2">
					<RssIcon className="size-5" />

					Sources ({commonSources.length})
				</Button>

				<Button variant={opened === "importances" ? "default" : "outline"} onClick={handleOpen("importances")} className="flex flex-row items-center gap-2">
					<StarIcon className="size-5" />

					Importance ({selectedImportance.length})
				</Button>
			</div>
		</>
	)
})

function PopupFilter({
	open,
	onClose,
	children
}: {
	open: boolean
	onClose: () => void
	children: ReactNode
}) {
	return (
		<Dialog open={open} onOpenChange={(newOpen) => (newOpen ? null : onClose())}>
			<DialogContent className="w-11/12 max-h-full overflow-auto">
				<DialogHeader>
					<DialogTitle>Filtrez les actualités</DialogTitle>
					<DialogDescription>Affinez les actualités en fonction de vos préférences</DialogDescription>
				</DialogHeader>

				{children}
			</DialogContent>
		</Dialog>
	)
}

function FilterComponent({
	selectedItems,
	setSelectedItems,
	items,
	labels,
	type
}: {
	selectedItems: string[]
	setSelectedItems: (value: string[]) => void
	items: string[]
	labels: { [key: string]: string | ReactNode }
	type: string
}) {
	const fetcher = useFetcher()

	const onChange = (checked: CheckedState, value: string): void => {
		let newItems: string[] = []

		if (checked) {
			newItems = [...selectedItems, value]
		} else {
			newItems = selectedItems.filter((item) => item !== value)
		}

		setSelectedItems(newItems)

		fetcher.submit(
			{
				type: "newsPreferences",
				[type]: newItems.join(","),
				redirect: "/news"
			},
			{
				method: "POST",
				action: "/settings",
				encType: "application/json"
			}
		)
	}

	return (
		<fetcher.Form className="flex flex-col items-center gap-2">
			{items.map((item) => (
				<div key={item} className="flex flex-row items-center justify-center gap-2">
					<Checkbox
						id={item}
						value={item}
						defaultChecked={selectedItems.includes(item)}
						onCheckedChange={(checked) => onChange(checked, item)}
					/>
					<Label htmlFor={item}>{labels[item]}</Label>
				</div>
			))}
		</fetcher.Form>
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
	actualPage,
	selectedLanguage,
	selectedImportance,
	selectedSource
}: {
	t: TFunction
	language: string
	actualPage: number
	selectedLanguage: string[]
	selectedImportance: string[]
	selectedSource: string[]
}) {
	const newsRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

	const {
		data: news,
		isPending,
		error
	} = useQuery<NewsFull[]>({
		queryKey: [
			"news",
			selectedLanguage,
			selectedImportance,
			selectedSource,
			{
				page: actualPage
			}
		],
		queryFn: async () => {
			const req = await fetch(
				`/api/news?page=${actualPage}&limit=20&languages=${selectedLanguage.join(",")}&importances=${selectedImportance.join(",")}&sources=${selectedSource.join(",")}`
			)
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
            (<div className="flex flex-col space-y-6">
                {skeletonArray.map((_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					(<SkeletonNews key={index} />)
				))}
            </div>)
        );
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
					starNumber={Math.floor(item.news.importanceScore / 50)}
					className="-right-[10px] -top-[10px] absolute"
				/>
			) : null}

			<Card className="border-card-border">
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
						<CardTitle className="flex flex-row items-center gap-2 font-bold">
							<img src={flags[item.news.lang]} alt={item.news.lang} className="size-5" />

							{item.news.title}
						</CardTitle>
					</CardHeader>
				</Link>

				<CardContent className="flex flex-col gap-6">
					<p>{item.news_article.shortDescription}</p>

					<DisplaySymbols symbolList={item.relatedSymbols} hash={item.news.id} t={t} />
				</CardContent>

				<CardFooter className="flex flex-col flex-wrap justify-start gap-1 text-muted-foreground lg:flex-row lg:items-center lg:gap-2">
					<span className="w-full lg:w-auto">
						{item.news.source}
					</span>

					<DotSeparator className="hidden lg:block" />

					<span className="w-full lg:w-auto">
						{new Date(item.news.published * 1000 || "").toLocaleDateString(language, {
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
			</Card>
		</div>
	))
})
