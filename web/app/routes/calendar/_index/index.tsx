import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvents } from "@/utils/events"
import type { MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react"
import countries from "../../../../../lang/countries-fr"
import { useEffect, useState } from "react"
import { ScrollTop } from "@/components/scrollTop"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const meta: MetaFunction = () => {
    const title = "Investor Helper - Calendrier"
    const description = "Consultez notre calendrier des événements économiques pour ne rien manquer des dates clés qui influencent les marchés financiers. Suivez les annonces économiques, les publications de rapports financiers et les décisions des banques centrales. Ce calendrier est un outil indispensable pour anticiper les mouvements de marché et ajuster vos stratégies d'investissement en fonction des événements mondiaux."

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: "https://investor-helper.com/calendar" },
    ]
}


export async function loader({
    params,
}: ClientLoaderFunctionArgs) {
    const { limit, page } = params

    // Convert the limit and page to numbers
    const limitResult = limit ? parseInt(limit) : 60
    const pageResult = page ? parseInt(page) : 1

    const events = await getEvents({ limit: limitResult, page: pageResult, desc: "asc" })

    return {
        events: events,
    }
}

export default function Index() {
    const { events } = useLoaderData<typeof loader>()

    const importance: Record<number, { name: string, color: string }> = {
        [-1]: {
            name: "faible",
            color: "text-green-500"
        },
        0: {
            name: "moyen",
            color: "text-orange-500"
        },
        1: {
            name: "élevé",
            color: "text-red-500"
        }
    }

    return (
        <div>
            <ScrollTop showBelow={250} />

            <div className="flex flex-col items-center justify-center space-y-4">
                <p className="pt-4 text-center text-2xl font-bold">Les événements</p>
            </div>

            {/* <Accordion type="single" collapsible className="px-4 lg:px-10">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Événements important passés aujourd'hui</AccordionTrigger>
                    <AccordionContent>
                        TOUT LES ÉVÉNEMENTS PASSÉS
                    </AccordionContent>
                </AccordionItem>
            </Accordion> */}

            <div className="flex flex-col space-y-6 p-4 lg:p-10">
                {events.map((event) => (
                    <div className="relative" key={event.id} id={event.id}>
                        {/* <Badge variant="destructive" className="absolute -right-[10px] -top-[10px]">
                            <MdPriorityHigh className="size-5" />
                        </Badge> */}

                        <Card>
                            <Link 
                                to={`/calendar/${event.id}`}
                                state={{
                                    redirect: "/calendar",
                                    hash: `#${event.id}`
                                }}
                            >
                                <CardHeader>
                                    <CardTitle>{event.title} - <span className={importance[event.importance].color}>Importance {importance[event.importance].name}</span></CardTitle>
                                </CardHeader>
                            </Link>

                            <CardContent>
                                {event.comment}
                            </CardContent>

                            <CardFooter className="flex flex-col items-center justify-start gap-1 lg:flex-row lg:gap-2">
                                <span className="text-center">{countries[event.country]}</span>
                                <span className="hidden lg:block">-</span>
                                <span className="text-center">
                                    {new Date(event.date || "").toLocaleDateString("fr-FR", {
                                        hour: "numeric",
                                        minute: "numeric",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        timeZoneName: "shortOffset",
                                    })}
                                </span>
                                <Counter date={event.date} />
                            </CardFooter>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Counter({ date }: { date: string }) {
    const [time, setTime] = useState<number>(0)

    const now = new Date()
    const eventDate = new Date(date)

    const diff = eventDate.getTime() - now.getTime()

    if (diff < 0) {
        return (
            <>
                <span className="hidden lg:block">-</span>
                <span className="text-center text-sky-500">Événement en cours</span>
            </>
        )
    }

    // Check if interval is more than 20 minutes
    if (diff > 20 * 60 * 1000) return null

    useEffect(() => {
        const interval = setInterval(() => {
            const newDate = new Date()

            setTime(eventDate.getTime() - newDate.getTime())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((time % (1000 * 60)) / 1000)

    const prettyTime = `${hours}h ${minutes}m ${seconds}s`

    return (
        <>
            <span className="hidden lg:block">-</span>
            <span className="text-center">Dans {prettyTime}</span>
        </>
    )
}