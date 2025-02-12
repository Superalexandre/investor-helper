import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, useFetcher, useLoaderData, useLocation } from "@remix-run/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { ScrollTop } from "@/components/scrollTop"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import type { NewsFull } from "../../../../types/News"
import SkeletonNews from "../../../components/skeletons/skeletonNews"
import DisplaySymbols from "../../../components/displaySymbols"
import { memo, type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import i18next from "../../../i18next.server"
import getNewsPreferences from "../../../lib/getNewsPreferences"
import { getSourceList } from "../../../../utils/news"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronsUpDownIcon, ExternalLinkIcon, GlobeIcon } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../../components/ui/command"
import { cn } from "../../../lib/utils"

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

export default function Index(): ReactNode {
	const { newsPreferences, allSources } = useLoaderData<typeof loader>()
	const { t, i18n } = useTranslation("news")

	// Memoize the translation function to prevent unstable references

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
				<p className="text-center font-bold text-2xl">{t("lastNews")}</p>
				{actualPage > 1 ? (
					<p className="text-muted-foreground text-sm">
						{t("page")} {actualPage}
					</p>
				) : null}

				{/* <Button variant="default">
                    Rafraîchir
                </Button> */}
			</div>

			<div className="flex flex-col space-y-6 p-4">
				<DisplayFilter
					t={t}
					selectedLanguage={selectedLanguage}
					setSelectedLanguage={setSelectedLanguage}
					selectedImportance={selectedImportance}
					setSelectedImportance={setSelectedImportance}
					allSources={allSources}
					selectedSource={selectedSource}
					setSelectedSource={setSelectedSource}
				/>

				<News
					t={t}
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
						rel="next"
					>
						{t("nextPage")}
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
	setSelectedSource,
}: {
	t: TFunction;
	selectedLanguage: string[];
	setSelectedLanguage: (value: string[]) => void;

	selectedImportance: string[];
	setSelectedImportance: (value: string[]) => void;

	allSources: string[];
	selectedSource: string[];
	setSelectedSource: (value: string[]) => void;
}) {
	const fetcher = useFetcher()

	const languageItems = ["fr-FR", "en-US"];
	const languageLabels: Record<string, string> = { "fr-FR": "Français", "en-US": "Anglais" };

	const importanceItems = ["none", "low", "medium", "high", "very-high"];
	const importanceLabels: Record<string, string> = {
		none: "Neutre",
		low: "Faible",
		medium: "Moyenne",
		high: "Forte",
		"very-high": "Très forte",
	};

	const importanceColors = [
		"bg-gray-200",
		"bg-green-400",
		"bg-yellow-400",
		"bg-orange-400",
		"bg-red-400"
	]

	const handleSync = (type: string, updatedItems: string[]) => {
		fetcher.submit(
			{
				type: "newsPreferences",
				[type]: updatedItems.join(","),
				redirect: "/news",
			},
			{
				method: "POST",
				action: "/settings",
				encType: "application/json",
			}
		);
	};

	const renderFilter = (
		title: string,
		items: string[],
		selectedItems: string[],
		setSelectedItems: (value: string[]) => void,
		type: string,
		children: (item: string) => ReactNode = (item) => item
	): ReactNode => {
		const [open, setOpen] = useState(false);

		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild={true}>
					<Button variant="outline" className="w-auto justify-between capitalize">
						{title} ({selectedItems.length})
						<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Command autoFocus={false} >
						<CommandInput 
							placeholder={`Rechercher ${title}`} 
							autoFocus={false}
						/>
						<CommandList>
							<CommandEmpty>Vide</CommandEmpty>
							<CommandGroup>
								{items.map((item) => (
									<CommandItem
										key={item}
										value={item}
										onSelect={(currentValue) => {
											let updatedItems: string[];
											if (selectedItems.includes(currentValue)) {
												updatedItems = selectedItems.filter((value) => value !== currentValue);
											} else {
												updatedItems = [...selectedItems, currentValue];
											}
											setSelectedItems(updatedItems);
											handleSync(type, updatedItems);
										}}
										className="capitalize"
									>
										<CheckIcon
											className={cn(
												"mr-2 h-4 w-4",
												selectedItems.includes(item) ? "opacity-100" : "opacity-0"
											)}
										/>

										{children(item)}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		);
	};

	return (
		<div className="flex flex-row items-center gap-2 overflow-x-auto">
			{renderFilter("Langue", languageItems, selectedLanguage, setSelectedLanguage, "languages", (item) => (
				<span>{languageLabels[item]}</span>
			))}
			{renderFilter("Importance", importanceItems, selectedImportance, setSelectedImportance, "importances", (item) => (
				<div className="flex w-full flex-row items-center justify-between">
					<span>{importanceLabels[item]}</span>

					<div 
						className={cn(
							"size-4 rounded-full",
							importanceColors[importanceItems.indexOf(item)],
							// selectedImportance.includes(item) ? "opacity-100" : "opacity-50"
						)}
					/>
				</div>
			))}
			{renderFilter("Sources", allSources, selectedSource, setSelectedSource, "sources", (item) => (
				<span>{item}</span>
			))}
		</div>
	);
});

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
				`/api/news?page=${actualPage}&limit=10&languages=${selectedLanguage.join(",")}&importances=${selectedImportance.join(",")}&sources=${selectedSource.join(",")}`
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

	const prettyLanguage: Record<string, string> = {
		"fr-FR": "Français",
		"en-US": "Anglais"
	}

	const prettyDate = (date: Date): string => date.toLocaleDateString(language, {
		hour: "numeric",
		minute: "numeric",
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZoneName: "shortOffset",
		weekday: "long"
	})

	return news.map((item) => (
		<Card key={item.news.id} className="border-card-border">
			<CardHeader>
				<div className="flex flex-col items-start justify-between gap-1.5 lg:flex-row lg:gap-4">
					<CardTitle className="flex-grow text-lg">
						<Link to={`/news/${item.news.id}`} className="flex items-start gap-2 hover:underline">
							<span className="line-clamp-2">{item.news.title}</span>
							<ExternalLinkIcon size={16} className="mt-1 flex-shrink-0" />
						</Link>
					</CardTitle>
					<div className="flex flex-shrink-0 flex-row-reverse items-center gap-2 lg:flex-row">
						<div className="flex flex-row items-center gap-2">
							<p className="block lg:hidden">Importance :</p>
							<ImportanceIndicator importance={Math.floor(item.news.importanceScore / 50)} />
						</div>
						<Badge variant="secondary" className="flex items-center gap-1">
							<GlobeIcon size={12} />
							{prettyLanguage[item.news.lang]}
						</Badge>
					</div>
				</div>
				<CardDescription className="flex items-center justify-between">
					<span>{item.news.source} - {prettyDate(new Date(item.news.published * 1000 || ""))}</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<p>{item.news_article.shortDescription}</p>
				{item.relatedSymbols.length > 0 ? (
					<div>
						<h4 className="mb-2 font-semibold text-sm">Associated Stocks :</h4>

						<DisplaySymbols symbolList={item.relatedSymbols} hash={item.news.id} t={t} />
					</div>
				) : null}
			</CardContent>
		</Card>
	))
})

function ImportanceIndicator({ importance }: { importance: number }) {
	if (importance > 4) {
		importance = 4;
	} else if (importance < 0) {
		importance = 0;
	}

	const colors = [
		"bg-gray-200",
		"bg-green-400",
		"bg-yellow-400",
		"bg-orange-400",
		"bg-red-400"
	]

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger name="Importance trigger" aria-label="Importance" asChild={true}>
					<div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
						<div
							className={`h-full ${colors[importance]}`}
							style={{ width: `${(importance + 1) * 20}%` }}
						/>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p>Importance: {importance + 1}/5</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}