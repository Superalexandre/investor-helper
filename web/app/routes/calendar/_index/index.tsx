import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { ScrollTop } from "@/components/scrollTop"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import i18next from "../../../i18next.server"
import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
import { isMobile } from "react-device-detect"
import { CalendarList, EconomicCalendarList } from "./List"
import { EconomicCalendar } from "./Calendar"

export async function loader({ request }: LoaderFunctionArgs) {
	const t = await i18next.getFixedT(request, "calendar")

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
		{ name: "canonical", content: "https://www.investor-helper.com/calendar" }
	]
}

export const handle = {
	i18n: "calendar"
}

export default function Index(): ReactNode {
	const { t, i18n } = useTranslation("calendar")

	const [display, setDisplay] = useQueryState("display", parseAsStringLiteral(["calendar", "list"]).withDefault(isMobile ? "list" : "calendar"))
	const [fullScreen, setFullScreen] = useQueryState("fullScreen", parseAsBoolean.withDefault(false))

	const isCalendar = display === "calendar"

	return (
		<div className="h-[calc(100vh-64px)]">
			<div className="flex h-full flex-col items-center">
				<ScrollTop showBelow={250} />

				{isCalendar && fullScreen ? null : (
					<div className="flex flex-col items-center justify-center space-y-4 pt-4">
						<p className="text-center font-bold text-2xl">{t("events")}</p>
					</div>
				)}

				<div
					className={cn(
						"flex h-full min-h-0 w-full flex-col space-y-6",
						isCalendar && fullScreen ? "p-0" : "p-4"
					)}>
					{isCalendar && fullScreen ? null : (
						<div className="flex flex-col">
							<div className="space-x-4">
								<Button variant="outline" onClick={(): void => {
									setDisplay(display === "list" ? "calendar" : "list")
									// startTransition(() => {
									// 	setDisplay(display === "list" ? "calendar" : "list")
									// })
								}}>
									{display === "list" ? "Calendrier" : "Liste"}
								</Button>
							</div>
						</div>
					)}

					{display === "list" ? (
						<CalendarList t={t} language={i18n.language} />
					) : (
						<EconomicCalendar
							t={t}
							language={i18n.language}
							isFullScreen={fullScreen}
							setFullScreen={() => setFullScreen(!fullScreen)}
						/>
					)}
				</div>
			</div>
		</div >
	)
}