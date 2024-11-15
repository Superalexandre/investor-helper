import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { MetaFunction } from "@remix-run/node"
// import { Link, useLocation, useNavigate } from "@remix-run/react"
import { Link, useLocation } from "@remix-run/react"
import countries from "../../../../../lang/countries-fr"
import { ScrollTop } from "@/components/scrollTop"
import TimeCounter from "../../../components/timeCounter"
import { useQuery } from "@tanstack/react-query"
import type { Events } from "../../../../../db/schema/events"
import { useEffect, useRef } from "react"
import SkeletonCalendar from "../../../components/skeletons/skeletonCalendar"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
// import { useState } from "react"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Calendrier"
	const description =
		"Consultez notre calendrier des événements économiques pour ne rien manquer des dates clés qui influencent les marchés financiers. Suivez les annonces économiques, les publications de rapports financiers et les décisions des banques centrales. Ce calendrier est un outil indispensable pour anticiper les mouvements de marché et ajuster vos stratégies d'investissement en fonction des événements mondiaux."

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ name: "canonical", content: "https://www.investor-helper.com/calendar" }
	]
}

export default function Index() {
	// const navigate = useNavigate()
	// const location = useLocation()

	// const urlTab = location.hash !== "" ? location.hash.replace("#", "") : "economicCalendar"
	// const [tab, setTab] = useState(urlTab)

	// const redirect = (id: string) => {
	// 	navigate(`/calendar#${id}`)

	// 	setTab(id)
	// }

	return (
		<div>
			<ScrollTop showBelow={250} />

			<div className="flex flex-col items-center justify-center space-y-4">
				<p className="pt-4 text-center font-bold text-2xl">Les événements</p>
			</div>

			{/* <Accordion type="single" collapsible className="px-4 lg:px-10">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Événements important passés aujourd'hui</AccordionTrigger>
                    <AccordionContent>
                        TOUT LES ÉVÉNEMENTS PASSÉS
                    </AccordionContent>
                </AccordionItem>
            </Accordion> */}

			<div className="w-full px-4 pt-4 lg:px-10 lg:pt-10">
				<EconomicCalendar />
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

function EconomicCalendar() {
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

	const importance: Record<number, { name: string; color: string }> = {
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

	return (
		<div className="flex flex-col space-y-6">
			{events.map((event) => (
				<div className="relative" key={event.id} id={event.id} ref={(element) => {
					calendarRefs.current[event.id] = element
				}}>
					<Card>
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
									<span> - </span>
									<span className={importance[event.importance].color}>
										Importance {importance[event.importance].name}
									</span>
								</CardTitle>
							</CardHeader>
						</Link>

						<CardContent>{event.comment}</CardContent>

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
}