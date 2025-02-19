import type { TFunction } from "i18next"
import { memo, type ReactNode, useState, useTransition } from "react"
import { useTranslation } from "react-i18next"
import { CalendarBody, CalendarDate, CalendarDatePagination, CalendarDatePicker, CalendarHeader, CalendarMonthPicker, CalendarProvider, type CalendarState, CalendarYearPicker } from "../../../components/ui/calendar"
import type { Events } from "../../../../../db/schema/events"
import { createParser, useQueryState } from "nuqs"
import { useQuery } from "@tanstack/react-query"
import { addDays, startOfMonth } from "date-fns"
import { Button } from "../../../components/ui/button"
import { Maximize2Icon, Minimize2Icon } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Link } from "@remix-run/react"
import { EventDetails } from "../$id"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"

export const EconomicCalendar = memo(function EconomicCalendar({
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
	const [isLoading, startTransition] = useTransition()
	// const calendar = useCalendar()

	const minYear = 2024
	const maxYear = 2025

	const defaultMonth = new Date().getMonth() as CalendarState["month"]
	const [month, setMonth] = useQueryState("month", createParser<CalendarState["month"]>({
		parse(queryValue): CalendarState["month"] | null {
			if (Number.isNaN(Number(queryValue))) {
				return null
			}

			const queryMonth = Number(queryValue)

			if (queryMonth < 0 || queryMonth > 11) {
				return null
			}

			return queryMonth as CalendarState["month"]
		},
		serialize(value): string {
			return value.toString()
		},
	}).withDefault(defaultMonth).withOptions({ startTransition, shallow: false }))

	const defaultYear = new Date().getFullYear() as CalendarState["year"]
	const [year, setYear] = useQueryState("year", createParser<CalendarState["year"]>({
		parse(queryValue): CalendarState["year"] | null {
			if (Number.isNaN(Number(queryValue))) {
				return null
			}

			const queryYear = Number(queryValue)

			if (queryYear < minYear || queryYear > maxYear) {
				return null
			}

			return queryYear as CalendarState["year"]
		},
		serialize(value): string {
			return value.toString()
		}
	}).withDefault(defaultYear).withOptions({ startTransition, shallow: false }))

	const {
		data: events,
		isPending,
		error
	} = useQuery<Events[][]>({
		queryKey: ["events", month, year],
		// queryFn: async () => {
		// 	const req = await fetch(`/api/calendar/economic?month=${month}&year=${year}`)

		// 	const json = await req.json()

		// 	return json
		// },
		queryFn: async () => await fetch("/api/calendar/economic").then(res => res.json()),
		refetchOnWindowFocus: true
	})

	if (isPending || isLoading) {
		const startMonth = startOfMonth(new Date(year, month))

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
								<CalendarMonthPicker
									month={month}
									setMonth={setMonth}
								/>
								<CalendarYearPicker
									start={2024}
									end={2025}
									year={year}
									setYear={setYear}
								/>
							</CalendarDatePicker>


							<div className="flex w-full flex-col items-center justify-between sm:w-auto sm:flex-row">
								<CalendarDatePagination className="flex w-full flex-row justify-between"
									month={month}
									setMonth={setMonth}
									year={year}
									setYear={setYear}
								/>

								<Button
									variant="ghost"
									onClick={setFullScreen}
									className="flex flex-row items-center justify-center gap-2"
									name="fullScreen"
									aria-label={isFullScreen ? "Minimiser" : "Maximiser"}
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
						<CalendarHeader textDirection="center" />
						<CalendarBody
							items={skeletonArray}
							maxItems={10}
							month={month}
							year={year}
						>
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

	const flatEvents = events.flat()

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
							<CalendarMonthPicker
								month={month}
								setMonth={setMonth}
							/>
							<CalendarYearPicker
								start={2024}
								end={2025}
								year={year}
								setYear={setYear}
							/>
						</CalendarDatePicker>

						<div className="flex w-full flex-col items-center justify-between sm:w-auto sm:flex-row">
							<CalendarDatePagination
								className="flex w-full flex-row justify-between"
								month={month}
								year={year}
								setMonth={setMonth}
								setYear={setYear}
							/>

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

					<CalendarBody
						items={flatEvents.map((event) => ({ ...event, endAt: event.date || "" }))}
						maxItems={10}
						month={month}
						year={year}
					>
						{({ item }): ReactNode => (
							<div className="ml-2 flex items-center gap-2" key={item.id}>
								<button className="flex flex-row items-center gap-2 truncate" type="button" onClick={(): void => setFocusEvent(item)}>
									{/* <img
										src={`https://flagcdn.com/${item.country.toLowerCase()}.svg`}
										alt={countries[language][item.country]}
										width="24"
									/> */}
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