import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
// import { Link, useLocation, useNavigate } from "@remix-run/react"
import { Link, useLocation } from "@remix-run/react"
import { ScrollTop } from "@/components/scrollTop"
import TimeCounter from "../../../components/timeCounter"
import { useQuery } from "@tanstack/react-query"
import type { Events } from "../../../../../db/schema/events"
import { memo, type ReactNode, useEffect, useRef, useState } from "react"
import SkeletonCalendar from "../../../components/skeletons/skeletonCalendar"
import { useTranslation } from "react-i18next"
import i18next from "../../../i18next.server"
import type { TFunction } from "i18next"
import { countries } from "../../../i18n"
import ImportanceBadge from "../../../components/importanceBadge"
import { DotSeparator } from "../../../components/ui/separator"
import { Button } from "../../../components/ui/button"
import { CalendarBody, CalendarDate, CalendarDatePagination, CalendarDatePicker, CalendarHeader, CalendarMonthPicker, CalendarProvider, CalendarYearPicker, useCalendar } from "../../../components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { EventDetails } from "../$id"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import { Skeleton } from "../../../components/ui/skeleton"
import { addDays, startOfMonth } from "date-fns"
import { Maximize2Icon, Minimize2Icon } from "lucide-react"
import { cn } from "../../../lib/utils"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
// import { useState } from "react"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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

export default function Index() {
	const { t, i18n } = useTranslation("calendar")
	const [display, setDisplay] = useState("calendar")
	const [fullScreen, setFullScreen] = useState(false)

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

				{/* px-4 pt-4 lg:px-10 lg:pt-10 */}
				{/* w-full flex-col space-y-6 px-4 pt-4 lg:px-10 lg:pt-10 */}
				<div
					className={cn(
						"flex h-full min-h-0 w-full flex-col space-y-6",
						isCalendar && fullScreen ? "px-0 pt-0" : "px-4 pt-4 lg:px-10 lg:pt-10"
					)}>
					{isCalendar && fullScreen ? null : (
						<div className="flex flex-col">
							<div className="space-x-4">
								<Button variant="outline" onClick={() => setDisplay(display === "list" ? "calendar" : "list")}>
									{display === "list" ? "Calendrier" : "Liste"}
								</Button>
							</div>
						</div>
					)}

					{display === "list" ? (
						<EconomicCalendarList t={t} language={i18n.language} />
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
			{/* <Tabs
				defaultValue={tab}
				className="min-h-max w-full px-4 pt-4 lg:px-10 lg:pt-10"
			>
				<TabsList className="w-full">
					<TabsTrigger className="w-full" value="economicCalendar" onClick={() => redirect("economicCalendar")}>
						Économie
					</TabsTrigger>
					<TabsTrigger className="w-full" value="revenueCalendar" onClick={() => redirect("revenueCalendar")}>
						Revenus
					</TabsTrigger>
					<TabsTrigger className="w-full" value="dividendsCalendar" onClick={() => redirect("dividendsCalendar")}>
						Dividendes
					</TabsTrigger>
				</TabsList>
				<TabsContent value="economicCalendar">
					<EconomicCalendar />
				</TabsContent>
				<TabsContent value="revenueCalendar">
					<p>Test</p>
				</TabsContent>
				<TabsContent value="dividendsCalendar">
					<p>Test</p>
				</TabsContent>
			</Tabs> */}
		</div>
	)
}

const EconomicCalendar = memo(function EconomicCalendar({
	t,
	language,
	isFullScreen,
	setFullScreen
}: {
	t: TFunction,
	language: string
	isFullScreen: boolean,
	setFullScreen: () => void
}) {
	const { t: tCalendar } = useTranslation("calendarId")
	const [focusEvent, setFocusEvent] = useState<Events | null>(null)
	const calendar = useCalendar()

	const month = calendar.month
	const year = calendar.year

	const {
		data: events,
		isPending,
		error
	} = useQuery<Events[]>({
		queryKey: ["events", month, year],
		queryFn: async () => {
			const req = await fetch(`/api/calendar/economic?month=${month}&year=${year}`)

			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	if (isPending) {
		const safeYear = year
		const safeMonth = month

		const startMonth = startOfMonth(new Date(safeYear, safeMonth))

		const skeletonArray = Array.from({ length: 31 }).map((_, index) => {
			const newDate = addDays(startMonth, index)

			return {
				endAt: newDate.toISOString(),
			}
		})

		return (
			<div className="flex h-full min-h-0 w-full items-center justify-center">
				<div className="relative h-full w-full rounded-md border bg-background">
					<CalendarProvider locale={language}>
						<CalendarDate className="flex-col gap-2 sm:flex-row">
							<CalendarDatePicker className="w-full justify-between sm:w-auto">
								<CalendarMonthPicker />
								<CalendarYearPicker start={2024} end={2025} />
							</CalendarDatePicker>


							<div className="flex w-full flex-col items-center justify-between sm:w-auto sm:flex-row">
								<CalendarDatePagination className="flex w-full flex-row justify-between" />

								<Button
									variant="ghost"
									onClick={setFullScreen}
									className="flex flex-row items-center justify-center gap-2"
								>
									{isFullScreen ? (
										<>
											<span className="block sm:hidden">Minimiser</span>
											<Minimize2Icon size={16} />
										</>
									) : (
										<>
											<span className="block sm:hidden">Maximiser</span>
											<Maximize2Icon size={16} />
										</>
									)}
								</Button>
							</div>
						</CalendarDate>
						<CalendarHeader
							textDirection="center"
						/>
						<CalendarBody items={skeletonArray} maxItems={10}>
							{({ item }): ReactNode => (
								<Skeleton
									key={item.endAt}
									className="h-full w-full"
								/>
							)}
						</CalendarBody>
					</CalendarProvider>
				</div>
			</div>
		)
	}

	if (error) {
		throw error
	}

	return (
		<div className="flex h-full min-h-0 w-full items-center justify-center sm:p-0">
			<Dialog
				open={!!focusEvent}
				onOpenChange={(open) => open ? null : setFocusEvent(null)}
			>
				<DialogContent className="max-h-[91%] w-11/12 max-w-[91%] overflow-auto lg:max-w-fit">
					<DialogHeader>
						<DialogTitle>Informations sur l'événements</DialogTitle>
						<DialogDescription>
							Informations détaillées sur l'événement {focusEvent?.title || ""}
						</DialogDescription>
					</DialogHeader>

					<div className="relative">
						<div className="flex w-full items-center justify-center lg:justify-end">
							<Button asChild={true} variant="default">
								<Link to={`/calendar/${focusEvent?.id}`}>
									Ouvrir la page de l'événement
								</Link>
							</Button>

						</div>

						{focusEvent ? (
							<EventDetails
								event={focusEvent}
								language={language}
								t={tCalendar}
							/>
						) : null}
					</div>
				</DialogContent>
			</Dialog>

			<div className="relative h-full w-full rounded-md border bg-background">
				<CalendarProvider locale={language} className="relative">
					<CalendarDate className="flex-col gap-2 sm:flex-row">
						<CalendarDatePicker className="w-full justify-between sm:w-auto">
							<CalendarMonthPicker />
							<CalendarYearPicker start={2024} end={2025} />
						</CalendarDatePicker>

						<div className="flex w-full flex-col items-center justify-between sm:w-auto sm:flex-row">
							<CalendarDatePagination className="flex w-full flex-row justify-between" />

							<Button
								variant="ghost"
								onClick={setFullScreen}
								className="flex flex-row items-center justify-center gap-2"
							>
								{isFullScreen ? (
									<>
										<span className="block sm:hidden">Minimiser</span>
										<Minimize2Icon size={16} />
									</>
								) : (
									<>
										<span className="block sm:hidden">Maximiser</span>
										<Maximize2Icon size={16} />
									</>
								)}
							</Button>
						</div>

					</CalendarDate>
					<CalendarHeader
						textDirection="center"
					/>

					{!events || events.length === 0 ? (
						<Alert variant="destructive" className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10 flex h-1/2 w-1/2 transform flex-col items-center justify-center bg-destructive">
							<AlertTitle className="text-destructive-foreground">
								Aucun événement
							</AlertTitle>
							<AlertDescription className="text-destructive-foreground">
								Aucun événement n'a été trouvé pour ce mois
							</AlertDescription>
						</Alert>

					) : null}

					<CalendarBody items={events.map((event) => ({ ...event, endAt: event.date || "" }))} maxItems={10}>
						{({ item }): ReactNode => (
							<div className="ml-2 flex items-center gap-2" key={item.id}>
								<button className="truncate" type="button" onClick={() => setFocusEvent(item)}>
									{item.title}
								</button>
							</div>
						)}
					</CalendarBody>
				</CalendarProvider>
			</div>
		</div>
	)
})

const EconomicCalendarList = memo(function EconomicCalendarList({
	t,
	language
}: {
	t: TFunction
	language: string
}) {
	const location = useLocation()
	const calendarRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

	const {
		data: events,
		isPending,
		error
	} = useQuery<Events[]>({
		queryKey: ["events"],
		queryFn: async () => {
			const req = await fetch("/api/calendar/economic")

			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	useEffect(() => {
		if (location.hash && events && events.length > 0) {
			const eventId = location.hash.replace("#", "")
			const newsRef = calendarRefs.current[eventId]

			if (newsRef) {
				newsRef.scrollIntoView({ behavior: "smooth" })
			}
		}
	}, [location.hash, events])

	const importance: Record<number, { name: string; color: string, stars: number }> = {
		[-1]: {
			name: t("low"),
			color: "text-green-500",
			stars: 1
		},
		0: {
			name: t("medium"),
			color: "text-orange-500",
			stars: 2
		},
		1: {
			name: t("high"),
			color: "text-red-500",
			stars: 3
		}
	}

	if (isPending) {
		const skeletonArray = Array.from({ length: 10 })

		return (
			<div>
				<div className="flex flex-col space-y-6">
					{skeletonArray.map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<SkeletonCalendar key={index} />
					))}
				</div>
			</div>
		)
	}

	if (error) {
		throw error
	}

	if (!events || events.length === 0) {
		return (
			<p className="text-center text-lg">{t("noEvents")}</p>
		)
	}

	return (
		<div className="flex flex-col space-y-6">
			{events.map((event) => (
				<div
					className="relative"
					key={event.id}
					id={event.id}
					ref={(element) => {
						calendarRefs.current[event.id] = element
					}}
				>
					<ImportanceBadge
						starNumber={importance[event.importance].stars}
						className="-right-[10px] -top-[10px] absolute"
					/>

					<Card className="border-card-border">
						<Link
							to={`/calendar/${event.id}`}
							state={{
								redirect: "/calendar",
								hash: `#${event.id}`,
								search: location.search
							}}
						>
							<CardHeader>
								<CardTitle>
									<span>{event.title}</span>
									{/* <span> - </span>
									<span className={importance[event.importance].color}>
										{t("importance")} {importance[event.importance].name}
									</span> */}
								</CardTitle>
							</CardHeader>
						</Link>

						<CardContent>{event.comment}</CardContent>

						<CardFooter className="flex flex-col flex-wrap justify-start gap-1 text-muted-foreground lg:flex-row lg:items-center lg:gap-2">
							<span className="w-full lg:w-auto">
								{countries[language][event.country]}
							</span>

							<DotSeparator className="hidden lg:block" />

							<span className="w-full lg:w-auto">
								{new Date(event.date || "").toLocaleDateString(language, {
									hour: "numeric",
									minute: "numeric",
									year: "numeric",
									month: "long",
									day: "numeric",
									timeZoneName: "shortOffset",
									weekday: "long"
								})}
							</span>

							<TimeCounter date={event.date} diff={20 * 60 * 1000} />
						</CardFooter>
					</Card>
				</div>
			))}
		</div>
	)
})