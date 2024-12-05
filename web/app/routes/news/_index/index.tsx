import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, useFetcher, useLoaderData, useLocation } from "@remix-run/react"
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

export async function loader({ request }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "news")
	const newsPreferences = await getNewsPreferences(request)

	console.log(newsPreferences)

	const title = t("title")
	const description = t("description")

	const sources = await getSourceList({
		languages: newsPreferences.languages
	})

	return {
		title: title,
		description: description,
		newsPreferences: newsPreferences,
		sources: sources
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
	const { newsPreferences, sources } = useLoaderData<typeof loader>()
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
	const [selectedSource, setSelectedSource] = useState<string[]>(sources as unknown as string[])

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
					allSources={sources as unknown as string[]}
					selectedSource={selectedSource}
					setSelectedSource={setSelectedSource}
				/>

				<News
					t={memoT}
					language={i18n.language}
					actualPage={actualPage}
					selectedLanguage={selectedLanguage}
					selectedImportance={selectedImportance}
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
					>
						<MdArrowBack className="size-5" />
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
					>
						{memoT("nextPage")}
						<MdArrowForward className="size-5" />
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
	const handleOpenLanguage = useCallback(() => setOpened("language"), [])
	const handleOpenSources = useCallback(() => setOpened("sources"), [])
	const handleOpenImportance = useCallback(() => setOpened("importance"), [])
	const handleOpenAll = useCallback(() => setOpened("all"), [])

	// Memoized handler for closing filters
	const handleClose = useCallback(() => setOpened(null), [])

	return (
		<>
			<PopupFilter open={opened === "language"} onClose={handleClose}>
				<FilterLanguage selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
			</PopupFilter>

			<PopupFilter open={opened === "importance"} onClose={handleClose}>
				<FilterImportance
					selectedImportance={selectedImportance}
					setSelectedImportance={setSelectedImportance}
				/>
			</PopupFilter>

			<PopupFilter open={opened === "sources"} onClose={handleClose}>
				<FilterSources
					allSources={allSources}
					selectedSource={selectedSource}
					setSelectedSource={setSelectedSource}
				/>
			</PopupFilter>

			<PopupFilter open={opened === "all"} onClose={handleClose}>
				<div className="flex flex-col items-center justify-center gap-4">
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-muted-foreground text-sm">Langue</p>
						<FilterLanguage selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
					</div>
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-muted-foreground text-sm">Importance</p>
						<FilterImportance
							selectedImportance={selectedImportance}
							setSelectedImportance={setSelectedImportance}
						/>
					</div>
				</div>
			</PopupFilter>

			<div className="flex flex-row items-center gap-2 overflow-x-auto">
				<Button variant={opened === "language" ? "default" : "outline"} onClick={handleOpenLanguage}>
					Langue ({selectedLanguage.length})
				</Button>

				<Button
					variant={opened === "sources" ? "default" : "outline"}
					onClick={handleOpenSources}
				>
					Sources ({selectedSource.length})
				</Button>

				<Button
					variant={opened === "importance" ? "default" : "outline"}
					onClick={handleOpenImportance}
				>
					Importance ({selectedImportance.length})
				</Button>

				<Button variant={opened === "all" ? "default" : "outline"} onClick={handleOpenAll}>
					Tout les filtres
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

function FilterLanguage({
	selectedLanguage,
	setSelectedLanguage
}: {
	selectedLanguage: string[]
	setSelectedLanguage: (value: string[]) => void
}) {
	// const submit = useSubmit()
	const fetcher = useFetcher()

	const onChange = (checked: CheckedState, value: string) => {
		let newLanguages = []

		if (checked) {
			setSelectedLanguage([...selectedLanguage, value])

			newLanguages = [...selectedLanguage, value]
		} else {
			setSelectedLanguage(selectedLanguage.filter((lang) => lang !== value))

			newLanguages = selectedLanguage.filter((lang) => lang !== value)
		}

		// submit({
		// 	type: "newsPreferences",
		// 	languages: selectedLanguage.join(","),
		// 	redirect: "/news"
		// }, {
		// 	method: "POST",
		// 	action: "/settings",
		//     encType: "application/json",
		// })

		fetcher.submit(
			{
				type: "newsPreferences",
				languages: newLanguages.join(","),
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
			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox
					id="french"
					value="fr-FR"
					defaultChecked={selectedLanguage.includes("fr-FR")}
					onCheckedChange={(checked) => onChange(checked, "fr-FR")}
				/>
				<Label htmlFor="french">Français</Label>
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox
					id="english"
					value="en-US"
					defaultChecked={selectedLanguage.includes("en-US")}
					onCheckedChange={(checked) => onChange(checked, "en-US")}
				/>
				<Label htmlFor="english">Anglais</Label>
			</div>
		</fetcher.Form>
	)
}

function FilterImportance({
	selectedImportance,
	setSelectedImportance
}: {
	selectedImportance: string[]
	setSelectedImportance: (value: string[]) => void
}) {
	// const submit = useSubmit()
	const fetcher = useFetcher()

	const onChange = (checked: CheckedState, value: string) => {
		let newImportances = []

		if (checked) {
			setSelectedImportance([...selectedImportance, value])

			newImportances = [...selectedImportance, value]
		} else {
			setSelectedImportance(selectedImportance.filter((importance) => importance !== value))

			newImportances = selectedImportance.filter((importance) => importance !== value)
		}

		fetcher.submit(
			{
				type: "newsPreferences",
				importances: newImportances.join(","),
				redirect: "/news"
			},
			{
				method: "POST",
				action: "/settings",
				encType: "application/json"
			}
		)

		// submit({
		// 	type: "newsPreferences",
		// 	importances: selectedImportance.join(","),
		// 	redirect: "/news"
		// }, {
		// 	method: "POST",
		// 	action: "/settings",
		//     encType: "application/json",
		// })
	}

	return (
		<fetcher.Form className="flex flex-col items-center gap-2">
			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox
					id="none"
					value="none"
					defaultChecked={selectedImportance.includes("none")}
					onCheckedChange={(checked) => onChange(checked, "none")}
				/>
				<Label htmlFor="none">Neutre</Label>
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox
					id="low"
					value="low"
					defaultChecked={selectedImportance.includes("low")}
					onCheckedChange={(checked) => onChange(checked, "low")}
				/>
				<Label htmlFor="low">Faible</Label>
				<ImportanceBadge importance={51} />
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox
					id="medium"
					value="medium"
					defaultChecked={selectedImportance.includes("medium")}
					onCheckedChange={(checked) => onChange(checked, "medium")}
				/>
				<Label htmlFor="medium">Moyenne</Label>
				<ImportanceBadge importance={101} />
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox
					id="high"
					value="high"
					defaultChecked={selectedImportance.includes("high")}
					onCheckedChange={(checked) => onChange(checked, "high")}
				/>
				<Label htmlFor="high">Forte</Label>
				<ImportanceBadge importance={151} />
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox
					id="very-high"
					value="very-high"
					defaultChecked={selectedImportance.includes("very-high")}
					onCheckedChange={(checked) => onChange(checked, "very-high")}
				/>
				<Label htmlFor="very-high">Très forte</Label>
				<ImportanceBadge importance={201} />
			</div>
		</fetcher.Form>
	)
}

function FilterSources({
	allSources,
	selectedSource,
	setSelectedSource
}: {
	allSources: string[]
	selectedSource: string[]
	setSelectedSource: (value: string[]) => void
}) {
	// const submit = useSubmit()
	const fetcher = useFetcher()

	const onChange = (checked: CheckedState, value: string) => {
		console.log(checked, value)

		// submit({
		// 	type: "newsPreferences",
		// 	languages: selectedLanguage.join(","),
		// 	redirect: "/news"
		// }, {
		// 	method: "POST",
		// 	action: "/settings",
		//     encType: "application/json",
		// })

		// fetcher.submit(
		// 	{
		// 		type: "newsPreferences",
		// 		languages: newLanguages.join(","),
		// 		redirect: "/news"
		// 	},
		// 	{
		// 		method: "POST",
		// 		action: "/settings",
		// 		encType: "application/json"
		// 	}
		// )
	}

	return (
		<fetcher.Form className="flex flex-col items-center gap-2">
			<div>
				{allSources.map((source) => (
					<div key={source} className="flex flex-row items-center justify-center gap-2">
						<Checkbox
							id={source}
							value={source}
							defaultChecked={selectedSource.includes(source)}
							onCheckedChange={(checked) => onChange(checked, source)}
						/>
						<Label htmlFor={source}>{source}</Label>
					</div>
				))}
			</div>
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
	selectedImportance
}: {
	t: TFunction
	language: string
	actualPage: number
	selectedLanguage: string[]
	selectedImportance: string[]
}) {
	const newsRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

	const {
		data: news,
		isPending,
		error
	} = useQuery<NewsSymbols[]>({
		queryKey: [
			"news",
			selectedLanguage,
			selectedImportance,
			{
				page: actualPage
			}
		],
		queryFn: async () => {
			const req = await fetch(
				`/api/news?page=${actualPage}&limit=20&languages=${selectedLanguage.join(",")}&importances=${selectedImportance.join(",")}`
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
						<CardTitle className="flex flex-row items-center gap-2">
							<img src={flags[item.news.lang]} alt={item.news.lang} className="size-5" />

							{item.news.title}
						</CardTitle>
					</CardHeader>
				</Link>

				<CardContent>
					<DisplaySymbols symbolList={item.relatedSymbols} hash={item.news.id} t={t} />
				</CardContent>

				<CardFooter>
					<p className="flex flex-row flex-wrap items-center gap-1 text-muted-foreground">
						{formatDate(item.news.published * 1000, {
							locale: language
						})}{" "}
						- {item.news.source}
						{/* <span>(via {item.news.mainSource})</span> */}
					</p>
				</CardFooter>
			</Card>
		</div>
	))
})
