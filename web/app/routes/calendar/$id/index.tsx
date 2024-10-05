import { Button } from "@/components/ui/button"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData, useLocation } from "@remix-run/react"
import { MdArrowBack, MdOpenInNew } from "react-icons/md"
import { ScrollTop } from "@/components/scrollTop"
import { getEventById } from "@/utils/events"
import { cn } from "@/lib/utils"

export async function loader({
    params,
}: LoaderFunctionArgs) {
    const { id } = params

    // Redirect to the news page if the id is not provided
    if (!id) return redirect("/calendar")

    const { event } = await getEventById({ id })

    if (!event) return redirect("/calendar")

    // const { news, relatedSymbols } = await getNewsById({ id })

    // if (!news) return redirect("/news")

    return {
        event,
        // news,
        // relatedSymbols
    }
}

export const meta: MetaFunction<typeof loader> = ({ params }) => {
    const title = "Investor Helper - Calendrier"
    // const description = data?.news.news.title ?? ""
    const description = ""

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: `https://investor-helper.com/calendar/${params.id}` },
    ]
}

export default function Index() {
    const location = useLocation()

    const { event } = useLoaderData<typeof loader>()


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

    console.log(event)

    return (
        <div className="relative flex w-full flex-col items-center overflow-hidden">
            <ScrollTop showBelow={250} />

            <div className="w-full">
                <Button asChild variant="default">
                    <Link
                        to={{
                            // pathname: "/news",
                            pathname: location.state?.redirect ?? "/calendar",
                            hash: location.state?.hash ?? undefined,
                        }}
                        className="left-0 top-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
                    >
                        <MdArrowBack className="size-6" />

                        Retour
                    </Link>
                </Button>
            </div>

            <div className="w-full px-4 lg:w-1/2">
                <div className="flex flex-col items-center justify-center pb-8">
                    <h1 className="pt-4 text-center text-2xl font-bold">
                        {event.title}
                    </h1>

                    <h2 className={cn(importance[event.importance].color, "text-xl")}>Importance {importance[event.importance].name}</h2>
                </div>

                <div className="flex w-full flex-col items-center gap-8">
                    <div className="flex w-full flex-col items-center">
                        <h2 className="text-xl font-bold">Description</h2>
                        <p className="">{event?.comment ?? "Aucune description"}</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-bold">Date</h2>
                        <p>{new Date(event.date).toLocaleDateString("fr", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}</p>

                        {event.period ? (
                            <p>Période : {event.period}</p>
                        ) : null}
                    </div>

                    {event.forecast || event.previous || event.actual ? (
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-bold">Chiffres</h2>

                            <div className="flex flex-col items-center">
                                <p>Précédent : <DisplayNumber number={event.previous} unit={event.unit} scale={event.scale} /></p>
                                <p>Actuel : <DisplayNumber number={event.actual} unit={event.unit} scale={event.scale} /></p>
                                <p>Prévisions : <DisplayNumber number={event.forecast} unit={event.unit} scale={event.scale} /></p>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-bold">Autres informations</h2>

                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col items-center">
                                <p>Indicateur : {event.indicator ?? "aucun indicateur"}</p>
                            </div>

                            <div className="flex flex-col items-center">
                                <p>Pays : {event.country}</p>
                                <p>Monnaie : {event.currency}</p>
                            </div>

                            <div className="flex flex-col items-center">
                                {event.sourceUrl ? (
                                    <p>
                                        Source : <Link to={event.sourceUrl} target="_blank" className="underline">{event.source} <MdOpenInNew className="inline-block" /></Link>
                                    </p>
                                ) : event.source ? (
                                    <p>Source : {event.source}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function DisplayNumber({ number, unit, scale }: { number: number | null, unit: string | null, scale: string | null }) {
    if (number === null) return <span>aucune donnée</span>

    return (
        <span>{number}{scale ? scale + " " : ""}{unit ? unit : ""}</span>
    )
}