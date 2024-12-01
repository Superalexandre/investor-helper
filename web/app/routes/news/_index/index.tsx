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
import { memo, ReactNode, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import i18next from "../../../i18next.server"
import { flags } from "../../../i18n"
import { Checkbox } from "../../../components/ui/checkbox"
import { Label } from "../../../components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { CheckedState } from "@radix-ui/react-checkbox"

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

	const [selectedLanguage, setSelectedLanguage] = useState<string[]>(["fr-FR"])
	const [selectedImportance, setSelectedImportance] = useState<string[]>(["none", "low", "medium", "high", "very-high"])

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
				<DisplayFilter
					t={t}

					selectedLanguage={selectedLanguage}
					setSelectedLanguage={setSelectedLanguage}

					selectedImportance={selectedImportance}
					setSelectedImportance={setSelectedImportance}
				/>

				<News
					t={t}
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

function DisplayFilter({ t, selectedLanguage, setSelectedLanguage, selectedImportance, setSelectedImportance }: {
	t: TFunction,
	selectedLanguage: string[],
	setSelectedLanguage: (value: string[]) => void,

	selectedImportance: string[],
	setSelectedImportance: (value: string[]) => void
}) {
	const [opened, setOpened] = useState<string | null>(null);

	return (
		<>
			<PopupFilter
				open={opened === "language"}
				onClose={() => setOpened(null)}
			>
				<FilterLanguage
					selectedLanguage={selectedLanguage}
					setSelectedLanguage={setSelectedLanguage}
				/>
			</PopupFilter>

			<PopupFilter
				open={opened === "importance"}
				onClose={() => setOpened(null)}
			>
				<FilterImportance
					selectedImportance={selectedImportance}
					setSelectedImportance={setSelectedImportance}
				/>
			</PopupFilter>

			<PopupFilter
				open={opened === "all"}
				onClose={() => setOpened(null)}
			>
				<div className="flex flex-col items-center justify-center gap-4">
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-muted-foreground text-sm">Langue</p>
						<FilterLanguage
							selectedLanguage={selectedLanguage}
							setSelectedLanguage={setSelectedLanguage}
						/>
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

			<div className="overflow-x-auto flex flex-row items-center gap-2">
				<Button variant={opened === "language" ? "default" : "outline"} onClick={() => setOpened("language")}>
					Langue ({selectedLanguage.length})
				</Button>

				<Button variant={opened === "importance" ? "default" : "outline"} onClick={() => setOpened("importance")}>
					Importance ({selectedImportance.length})
				</Button>

				<Button variant={opened === "all" ? "default" : "outline"} onClick={() => setOpened("all")}>Tout les filtres</Button>
			</div>
		</>
	);
}

function PopupFilter({
	open,
	onClose,
	children,
}: {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
}) {
	return (
		<Dialog
			open={open}
			onOpenChange={(newOpen) => newOpen ? null : onClose()}
		>
			<DialogContent className="w-11/12 max-h-full overflow-auto">
				<DialogHeader>
					<DialogTitle>Filtrez les actualités</DialogTitle>
					<DialogDescription>
						Affinez les actualités en fonction de vos préférences
					</DialogDescription>
				</DialogHeader>

				{children}
			</DialogContent>
		</Dialog>
	);
}

function FilterLanguage({
	selectedLanguage,
	setSelectedLanguage
}: {
	selectedLanguage: string[],
	setSelectedLanguage: (value: string[]) => void
}) {
	const onChange = (checked: CheckedState, value: string) => {
		if (checked) {
			setSelectedLanguage([...selectedLanguage, value])
		} else {
			setSelectedLanguage(selectedLanguage.filter((lang) => lang !== value))
		}
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox id="french" value="fr-FR" defaultChecked={selectedLanguage.includes("fr-FR")} onCheckedChange={(checked) => onChange(checked, "fr-FR")} />
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
		</div>
	)
}

function FilterImportance({
	selectedImportance,
	setSelectedImportance
}: {
	selectedImportance: string[],
	setSelectedImportance: (value: string[]) => void
}) {

	const onChange = (checked: CheckedState, value: string) => {
		if (checked) {
			setSelectedImportance([...selectedImportance, value])
		} else {
			setSelectedImportance(selectedImportance.filter((importance) => importance !== value))
		}
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox id="none" value="none" defaultChecked={selectedImportance.includes("none")} onCheckedChange={(checked) => onChange(checked, "none")} />
				<Label htmlFor="none">Neutre</Label>
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox id="low" value="low" defaultChecked={selectedImportance.includes("low")} onCheckedChange={(checked) => onChange(checked, "low")} />
				<Label htmlFor="low">Faible</Label>
				<ImportanceBadge importance={51} />
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox id="medium" value="medium" defaultChecked={selectedImportance.includes("medium")} onCheckedChange={(checked) => onChange(checked, "medium")} />
				<Label htmlFor="medium">Moyenne</Label>
				<ImportanceBadge importance={101} />
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox id="high" value="high" defaultChecked={selectedImportance.includes("high")} onCheckedChange={(checked) => onChange(checked, "high")} />
				<Label htmlFor="high">Forte</Label>
				<ImportanceBadge importance={151} />
			</div>

			<div className="flex flex-row items-center justify-center gap-2">
				<Checkbox id="very-high" value="very-high" defaultChecked={selectedImportance.includes("very-high")} onCheckedChange={(checked) => onChange(checked, "very-high")} />
				<Label htmlFor="very-high">Très forte</Label>
				<ImportanceBadge importance={201} />
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
	actualPage,
	selectedLanguage,
	selectedImportance
}: {
	t: TFunction,
	language: string,
	actualPage: number,
	selectedLanguage: string[],
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
			const req = await fetch(`/api/news?page=${actualPage}&limit=20&languages=${selectedLanguage.join(",")}&importances=${selectedImportance.join(",")}`)
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
						})} - {item.news.source}
						{/* <span>(via {item.news.mainSource})</span> */}
					</p>
				</CardFooter>
			</Card>
		</div>
	))
})