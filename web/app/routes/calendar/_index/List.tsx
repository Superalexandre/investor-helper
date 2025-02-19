import { Link, useLocation } from "@remix-run/react"
import ImportanceBadge from "../../../components/importanceBadge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { DotSeparator } from "../../../components/ui/separator"
import TimeCounter from "../../../components/timeCounter"
import { countries } from "../../../i18n"
import { memo, type ReactNode, useEffect, useRef } from "react"
import type { TFunction } from "i18next"
import type { Events } from "../../../../../db/schema/events"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../components/ui/accordion"
import { Button } from "../../../components/ui/button"
import SkeletonCalendar from "../../../components/skeletons/skeletonCalendar"
import { useQuery } from "@tanstack/react-query"
import { ExternalLinkIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"

export const CalendarList = memo(function CalendarList({
    t,
    language
}: {
    t: TFunction
    language: string
}) {
    return (
        <Tabs
            defaultValue="economicCalendar"
            className="min-h-max w-full"
        >
            <TabsList className="w-full">
                <TabsTrigger className="w-full" value="economicCalendar">
                    Économie
                </TabsTrigger>
                <TabsTrigger className="w-full" value="revenueCalendar" disabled={true}>
                    Revenus
                </TabsTrigger>
                <TabsTrigger className="w-full" value="dividendsCalendar" disabled={true}>
                    Dividendes
                </TabsTrigger>
            </TabsList>
            <TabsContent value="economicCalendar">
                <EconomicCalendarList 
                    t={t}
                    language={language}
                />
            </TabsContent>
            <TabsContent value="revenueCalendar">
                <p>Test</p>
            </TabsContent>
            <TabsContent value="dividendsCalendar">
                <p>Test</p>
            </TabsContent>
        </Tabs>
    )
})
export const EconomicCalendarList = memo(function EconomicCalendarList({
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
    } = useQuery<Events[][]>({
        queryKey: ["events"],
        queryFn: async () => await fetch("/api/calendar/economic").then(res => res.json()),
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
            {events.map((eventGroup) => {

                if (eventGroup.length <= 1) {
                    return (
                        <EconomicCalendarItem
                            key={eventGroup[0].id}
                            event={eventGroup[0]}
                            language={language}
                            t={t}
                        />
                    )
                }

                return (
                    <Accordion type="single" collapsible={true} key={eventGroup[0].id}>
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="rounded-xl border border-card-border p-0 pr-4 data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                                <Card className="border-none">
                                    <CardHeader>
                                        <CardTitle className="flex justify-start">
                                            <span>
                                                {eventGroup.length} événements
                                            </span>
                                        </CardTitle>
                                    </CardHeader>

                                    <CardFooter className="flex flex-col flex-wrap justify-start gap-1 text-muted-foreground lg:flex-row lg:items-center lg:gap-2">
                                        <span className="w-full lg:w-auto">
                                            {countries[language][eventGroup[0].country]}
                                        </span>

                                        <DotSeparator className="hidden lg:block" />

                                        <span className="w-full lg:w-auto">
                                            {new Date(eventGroup[0].date || "").toLocaleDateString(language, {
                                                hour: "numeric",
                                                minute: "numeric",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                timeZoneName: "shortOffset",
                                                weekday: "long"
                                            })}
                                        </span>

                                        <TimeCounter date={eventGroup[0].date} diff={20 * 60 * 1000} />
                                    </CardFooter>
                                </Card>
                                {/* {eventGroup.length} événements au {eventGroup[0].country} */}
                            </AccordionTrigger>
                            <AccordionContent className="rounded-xl rounded-t-none border border-card-border border-t-0 p-4">
                                <div className="flex flex-col gap-4">
                                    {eventGroup.map((event) => (
                                        <Button variant="link" asChild={true} key={event.id} className="justify-start px-2">
                                            <Link to={`/calendar/${event.id}`} className="flex flex-row items-center justify-start gap-2">
                                                <div className="flex w-1/2 flex-col items-start justify-start gap-1">
                                                    <p className="truncate font-bold">{event.title}</p>
                                                    <p className="max-w-full truncate text-muted-foreground text-sm">{event.comment}</p>
                                                </div>

                                                <ExternalLinkIcon className="size-5 min-h-5 min-w-5" />
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            })}
        </div>
    )
})

const EconomicCalendarItem = memo(function EconomicCalendarItem({
    event,
    language,
    t
}: {
    event: Events,
    language: string,
    t: TFunction
}): ReactNode {

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

    return (
        <div
            className="relative"
            key={event.id}
            id={event.id}
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
    )
})