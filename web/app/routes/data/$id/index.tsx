import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, Form, redirect, useActionData, useLoaderData } from "@remix-run/react"
import getPrices, { PeriodInfo } from "@/utils/getPrices"
import { ClientOnly } from "remix-utils/client-only"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import getSymbolData from "@/utils/getSymbol"
// import { format } from "date-fns"
import { toZonedTime, format as formatTz } from "date-fns-tz"

export async function loader({
    params
}: ClientLoaderFunctionArgs) {
    if (!params.id) return redirect("/")

    const { period: prices, periodInfo: marketInfo } = await getPrices(params.id)
    const symbol = await getSymbolData(params.id)

    return {
        prices: prices.reverse(),
        symbol,
        marketInfo
    }
}

export async function action({
    params,
    request,
}: ActionFunctionArgs) {
    if (!params.id) return redirect("/")

    const body = await request.formData()
    const timeframe = body.get("timeframe")

    const { period: prices, periodInfo: marketInfo } = await getPrices(params.id, {
        timeframe: timeframe as string
    })

    return {
        prices: prices.reverse(),
        marketInfo
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const { prices, symbol, marketInfo } = useLoaderData<typeof loader>()
    const data = useActionData<typeof action>()

    const chartConfig = {
        close: {
            label: "Prix",
            color: "hsl(var(--chart-1))",
        },
        time: {
            label: "Date",
        },
        volume: {
            label: "Volume",
            color: "hsl(var(--chart-2))",
        },
    } satisfies ChartConfig


    return (
        <div>
            <div>
                <div className="flex flex-col items-center justify-center gap-4 pt-4">
                    <div className="flex flex-row items-center justify-center gap-2">
                        <img
                            src={"https://s3-symbol-logo.tradingview.com/" + symbol.logoid + ".svg"}
                            alt={symbol.description}
                            className="size-12 rounded-full"
                        />

                        <h1 className="text-center text-2xl">Graphique pour {symbol.description}</h1>
                    </div>

                    <DisplaySession marketInfo={marketInfo} />
                </div>

                <Form method="POST">
                    <Button variant="outline" name="timeframe" value="1">1 minutes</Button>
                    {/* <Button variant="outline" name="timeframe" value="3">3</Button> */}
                    {/* <Button variant="outline" name="timeframe" value="5">5</Button> */}
                    {/* <Button variant="outline" name="timeframe" value="15">15</Button> */}
                    {/* <Button variant="outline" name="timeframe" value="30">30</Button> */}
                    {/* <Button variant="outline" name="timeframe" value="45">45</Button> */}
                    <Button variant="outline" name="timeframe" value="60">1h</Button>
                    <Button variant="outline" name="timeframe" value="120">2h</Button>
                    {/* <Button variant="outline" name="timeframe" value="180">180</Button> */}
                    {/* <Button variant="outline" name="timeframe" value="240">240</Button> */}
                    <Button variant="outline" name="timeframe" value="1D">1D</Button>
                    <Button variant="outline" name="timeframe" value="1W">1W</Button>
                    <Button variant="outline" name="timeframe" value="1M">1M</Button>
                    {/* <Button variant="outline" name="timeframe" value="W">W</Button> */}
                    {/* <Button variant="outline" name="timeframe" value="M">M</Button> */}
                </Form>

                <ClientOnly fallback={<p>Chargement...</p>}>
                    {() => (
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <ComposedChart
                                data={data?.prices ?? prices}
                                accessibilityLayer
                            >
                                <CartesianGrid
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="time"
                                    tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleString("fr-FR")}

                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    scale="auto"
                                />

                                <YAxis
                                    dataKey="close"
                                    yAxisId="left"
                                    tickLine={false}
                                    axisLine={false}
                                    scale="linear"
                                />

                                <YAxis
                                    dataKey="volume"
                                    yAxisId="right"
                                    orientation="right"
                                    hide
                                    scale="auto"
                                />

                                <Bar
                                    yAxisId="right"
                                    dataKey="volume"
                                    fill="var(--color-volume)"
                                    radius={8}
                                />

                                <Line
                                    yAxisId="left"
                                    dataKey="close"
                                    type="natural"
                                    stroke="var(--color-close)"
                                    strokeWidth={2}
                                    dot={false}
                                    className="z-10"
                                />

                                <ChartLegend
                                    content={
                                        <ChartLegendContent
                                            onClick={(dataKey) => {
                                                console.log(dataKey)
                                            }}
                                        />
                                    }
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent
                                        indicator="dot"
                                        labelFormatter={(value, dataLabel) => {
                                            return new Date(dataLabel[0].payload.time * 1000).toLocaleString("fr-FR", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "numeric",
                                            })
                                        }}
                                    />}
                                />
                            </ComposedChart>
                        </ChartContainer>
                    )}
                </ClientOnly>
            </div>
        </div>

    )
}

function DisplaySession({ marketInfo }: { marketInfo: PeriodInfo }) {
    const [, city] = marketInfo.timezone.split("/")

    const sessionFrench: Record<string, string> = {
        "regular": "Marché ouvert",
        "premarket": "Pré-marché",
        "postmarket": "Post-marché",
        "extended": "Marché fermé",
    }

    // const sessionColors: Record<string, string> = {
    //     "regular": "bg-green-500",
    //     "premarket": "bg-yellow-500",
    //     "postmarket": "bg-blue-500",
    //     "extended": "bg-gray-500",
    // }

    // const date = new Date()
    const date = toZonedTime(new Date(), marketInfo.timezone)
    const prettyDate = formatTz(date, "HH:mm", { timeZone: marketInfo.timezone })

    const orderSessions = ["premarket", "regular", "postmarket", "extended"]

    const orderedSessions = orderSessions.map((session) => {
        return marketInfo.subsessions.find((subsession) => subsession.id === session)
    }).filter((session) => session !== undefined)

    // for (const session of orderedSessions) {
    //     // session.session : "0400-0930"
    //     if (!session) continue

    //     const [start, end] = session.session.split("-")
    //     const prettyStart = start.slice(0, 2) + ":" + start.slice(2)
    //     const prettyEnd = end.slice(0, 2) + ":" + end.slice(2)

    //     console.log(`${sessionFrench[session.id]} de ${prettyStart} à ${prettyEnd}`)
    // }

    // Display the active session
    const activeSession = orderedSessions.find((session) => {
        if (!session) return false

        const [start, end] = session.session.split("-")
        const now = date.getHours() * 100 + date.getMinutes()

        return now >= parseInt(start) && now <= parseInt(end)
    })

    // Get the time until the market open, or the time until the market close
    // const now = date.getHours() * 100 + date.getMinutes()
    // const [start, end] = orderedSessions[1].session.split("-")
    // const marketOpen = parseInt(start)
    // const marketClose = parseInt(end)

    // let timeUntil: number
    // if (now < marketOpen) {
    //     timeUntil = marketOpen - now
    // } else {
    //     timeUntil = marketClose - now
    // }

    // console.log(timeUntil)

    // Check if the market will open or close soon
    const typeFrench: Record<string, string> = {
        "open": "Ouverture",
        "close": "Fermeture",
    }
    const type = activeSession?.id === "regular" ? "close" : "open"
    let timeUntil: number

    if (type === "open") {
        const [start] = orderedSessions[1].session.split("-")
        const marketOpen = parseInt(start)
        const now = date.getHours() * 100 + date.getMinutes()

        timeUntil = marketOpen - now
    } else {
        const [end] = orderedSessions[1].session.split("-")
        const marketClose = parseInt(end)
        const now = date.getHours() * 100 + date.getMinutes()

        timeUntil = marketClose - now
    }

    timeUntil = Math.abs(timeUntil)

    const prettyHours = Math.floor(timeUntil / 60)
    const prettyMinutes = timeUntil % 60

    const prettyTimeUntil = `${prettyHours}h ${prettyMinutes}m`

    return (
        <div className="flex flex-col items-center justify-start">
            <p className="">Il est {prettyDate} à {city}</p>
            {/* <div className="flex flex-row items-center justify-center gap-2">
                {orderedSessions.map((session) => (
                    <div>
                        <div className={cn("h-2 w-14 rounded-md", sessionColors[session.id])}></div>
                    </div>
                ))}
            </div> */}
            <p>Session active : {sessionFrench[activeSession?.id ?? "extended"]}</p>
            <p>{typeFrench[type]} dans {prettyTimeUntil}</p>
        </div>
    )
}