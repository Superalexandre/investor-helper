import { useTranslation } from "react-i18next"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { changeLanguage, type TFunction } from "i18next"
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import i18next from "../../i18next.server"
import { Form, useLoaderData, useSubmit } from "react-router";
import { clearCache, getSession, getUser, setSession } from "../../session.server"
import i18n from "../../i18n"
import { getTheme } from "../../lib/getTheme"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import getHomePreferences from "../../lib/getHomePreferences"
import type HomePreferences from "../../../types/Preferences"
import { memo, useState } from "react"
import { changeUserLanguage, changeUserTheme } from "../../lib/userPreferences"
import { Button } from "../../components/ui/button"
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { getSourceList } from "../../../utils/news"
import { GripVerticalIcon } from "lucide-react"
import logger from "../../../../log"

export async function action({ request }: ActionFunctionArgs) {
	// Get url parameters
	const url = new URL(request.url)
	const type = url.searchParams.get("type")

	if (type === "emptyCache") {
		return clearCache({
			request: request,
			redirectUrl: "/settings"
		})
	}

	const [data, user] = await Promise.all([request.json(), getUser(request)])

	// biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
	if (!data || !data.type) {
		return {
			success: false,
			error: true,
			message: "Invalid request"
		}
	}

	if (data.type === "language") {
		// biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
		if (!data.value || !i18n.supportedLngs.includes(data.value)) {
			return {
				success: false,
				error: true,
				message: "Invalid language"
			}
		}

		if (user) {
			await changeUserLanguage({
				user: user,
				language: data.value
			})
		}

		return setSession({
			key: "language",
			value: data.value,
			request: request,
			redirectUrl: data.redirect ?? "/settings"
		})
	}

	if (data.type === "theme") {
		// biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
		if (!data.value || !["dark", "light", "light-dark"].includes(data.value)) {
			return {
				success: false,
				error: true,
				message: "Invalid language"
			}
		}

		if (user) {
			await changeUserTheme({
				user: user,
				theme: data.value
			})
		}

		return setSession({
			key: "theme",
			value: data.value,
			request: request,
			redirectUrl: data.redirect ?? "/settings"
		})
	}

	if (data.type === "homePreferences") {
		// biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
		if (!data.value || !Array.isArray(data.value)) {
			return {
				success: false,
				error: true,
				message: "Invalid preferences"
			}
		}

		return setSession({
			key: "homePreferences",
			value: data.value,
			request: request,
			redirectUrl: data.redirect ?? "/settings"
		})
	}

	if (data.type === "newsPreferences") {
		if (
			// biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
			!data.languages &&
			!Array.isArray(data.languages) &&
			!data.importances &&
			!Array.isArray(data.importances) &&
			(!data.sources && data.sources !== "")
		) {
			logger.warn(`Invalid preferences ${data.languages} ${data.importances}`, {
				data
			})

			return {
				success: false,
				error: true,
				message: "Invalid preferences"
			}
		}

		const session = await getSession(request)
		const newsPreferences = session.get("newsPreferences")

		let newLanguages: string[] = []
		let newImportances: string[] = []
		let newSources: string[] = []

		if (data.languages) {
			newLanguages = data.languages.split(",")
		} else if (newsPreferences) {
			newLanguages = newsPreferences.languages
		} else {
			newLanguages = [i18n.fallbackLng]
		}

		if (data.importances) {
			newImportances = data.importances.split(",")
		} else if (newsPreferences) {
			newImportances = newsPreferences.importances
		} else {
			newImportances = ["none", "low", "medium", "high", "very-high"]
		}

		if (data.sources && data.sources !== "") {
			newSources = data.sources.split(",")
		} else if (data.sources === "") {
			newSources = []
		} else if (newsPreferences) {
			newSources = newsPreferences.sources
		} else {

			const sources = await getSourceList({
				languages: newLanguages
			})

			newSources = sources
		}

		const newNewsPreferences = {
			languages: newLanguages,
			importances: newImportances,
			sources: newSources
		}

		return setSession({
			key: "newsPreferences",
			value: newNewsPreferences,
			request: request,
			redirectUrl: data.redirect ?? "/settings"
		})
	}

	return {
		success: false,
		error: true,
		message: "Invalid request"
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const [t, theme, homePreferences] = await Promise.all([
		i18next.getFixedT(request, "settings"),
		getTheme(request),
		getHomePreferences(request)
	])

	const title = t("title")
	const description = t("description")

	return {
		theme: theme,
		title: title,
		description: description,
		homePreferences: homePreferences
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
		{ tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/settings" }
	]
}

export const handle = {
	i18n: "settings"
}

export default function Index() {
	const { theme, homePreferences } = useLoaderData<typeof loader>()
	const { t, i18n } = useTranslation("settings")

	return (
		<div>
			<div className="flex flex-col items-center justify-center space-y-4">
				<p className="pt-4 text-center font-bold text-2xl">{t("settings")}</p>
			</div>
			<div className="flex w-full flex-col items-center justify-center space-y-6 p-4 lg:p-10">
				<ChangeLanguage language={i18n.language} t={t} />

				<ChangeTheme theme={theme} t={t} />

				<ChangeHomePreferences t={t} homePreferences={homePreferences} />

				<ClearCache />
			</div>
		</div>
	)
}

const ChangeLanguage = memo(function ChangeLanguage({
	language,
	t
}: {
	language: string
	t: TFunction
}) {
	const submit = useSubmit()

	const handleChange = (value: string) => {
		changeLanguage(value)

		submit(
			{
				type: "language",
				value: value
			},
			{
				method: "POST",
				action: "/settings",
				encType: "application/json"
			}
		)
	}

	return (
		<Form
			method="POST"
			action="/settings"
			className="flex w-3/4 flex-col items-center justify-center gap-2 lg:w-1/2"
		>
			<Label htmlFor="language">{t("language")}</Label>
			<Select name="language" defaultValue={language} onValueChange={handleChange} aria-label="Choose language">
				<SelectTrigger>
					<SelectValue placeholder={t("chooseLanguage")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="fr-FR">Français (France)</SelectItem>
					<SelectItem value="en-US">English (US)</SelectItem>
				</SelectContent>
			</Select>
		</Form>
	)
})

const ChangeTheme = memo(function ChangeTheme({
	theme,
	t
}: {
	theme: string
	t: TFunction
}) {
	const submit = useSubmit()

	const handleChange = (value: string) => {
		submit(
			{
				type: "theme",
				value: value
			},
			{
				method: "POST",
				action: "/settings",
				encType: "application/json"
			}
		)
	}

	return (
		<Form className="flex w-3/4 flex-col items-center justify-center gap-2 lg:w-1/2">
			<Label htmlFor="theme">{t("theme")}</Label>
			<Select name="theme" defaultValue={theme} onValueChange={(value) => handleChange(value)} aria-label="Choose theme">
				<SelectTrigger>
					<SelectValue placeholder={t("chooseTheme")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="light-dark">{t("dark")}</SelectItem>
					<SelectItem value="light">{t("light")}</SelectItem>
					<SelectItem value="dark">{t("veryDark")}</SelectItem>
				</SelectContent>
			</Select>
		</Form>
	)
})

const ChangeHomePreferences = memo(function ChangeHomePreferences({
	t,
	homePreferences
}: {
	t: TFunction
	homePreferences: HomePreferences[]
}) {
	const [homePreferencesState, setHomePreferencesState] = useState<HomePreferences[]>(homePreferences)
	const submit = useSubmit()

	const handleChangePosition = (event: DragEndEvent) => {
		const { active, over } = event

		if (!over || active.id === over.id) {
			return
		}

		console.log("Handle change position", active, over)

		const oldIndex = homePreferences.findIndex((item) => item.id === active.id)
		const newIndex = homePreferences.findIndex((item) => item.id === over.id)

		homePreferences[oldIndex].position = newIndex
		homePreferences[newIndex].position = oldIndex

		const newPreferences = arrayMove(homePreferences, oldIndex, newIndex)

		setHomePreferencesState(newPreferences)

		submit(
			{
				type: "homePreferences",
				value: newPreferences as unknown[] as string[]
			},
			{
				method: "POST",
				action: "/settings",
				encType: "application/json",
			}
		)
	}

	const sensors = useSensors(useSensor(PointerSensor))

	return (
		<Form className="flex w-3/4 flex-col items-center justify-center gap-2 lg:w-1/2 touch-pan-x">
			<Label className="text-center">Préférences de la page d'accueil</Label>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChangePosition} modifiers={[restrictToParentElement]}>
				<SortableContext
					items={homePreferencesState.map((item) => item.id)}
					strategy={verticalListSortingStrategy}
				>
					{homePreferencesState.map((item) => (
						<SortableItem key={item.id} item={item} />
					))}
				</SortableContext>
			</DndContext>
		</Form>
	)
})

function SortableItem({ item }: { item: HomePreferences /*changeVisibility: (id: string) => void*/ }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`flex w-full flex-row items-center justify-center gap-2 ${isDragging ? "cursor-grabbing" : "hover:cursor-grab"}`}
		>
			<p>{item.title}</p>

			<GripVerticalIcon className="ml-auto" />
			{/* <Button variant="ghost">
                {item.visible ? (
                    <MdVisibility />
                ) : (
                    <MdVisibilityOff />
                )}
            </Button> */}
		</div>
	)
}

const ClearCache = memo(function ClearCache() {
	return (
		<Form method="POST" action="/settings?type=emptyCache" className="flex w-3/4 flex-col items-center justify-center gap-2 lg:w-1/2">
			<Button variant="destructive" type="submit">
				Vider le cache
			</Button>
		</Form>
	)
})
