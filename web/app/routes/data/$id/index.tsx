import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, Form, redirect, useActionData, useLoaderData } from "@remix-run/react"
import getPrices from "@/utils/getPrices"
import { ClientOnly } from "remix-utils/client-only"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import getSymbolData from "@/utils/getSymbol"

export async function loader({
    params
}: ClientLoaderFunctionArgs) {
    if (!params.id) return redirect("/")

    const prices = await getPrices(params.id)
    const symbol = await getSymbolData(params.id)

    return {
        prices: prices.reverse(),
        symbol
    }
}

export async function action({
    params,
    request,
}: ActionFunctionArgs) {
    if (!params.id) return redirect("/")

    const body = await request.formData()
    const timeframe = body.get("timeframe")

    const prices = await getPrices(params.id, {
        timeframe: timeframe as string
    })

    return {
        prices: prices.reverse()
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const { prices, symbol } = useLoaderData<typeof loader>()
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
                <div className="flex flex-row items-center justify-center gap-2">
                    <img
                        src={"https://s3-symbol-logo.tradingview.com/" + symbol.logoid + ".svg"}
                        alt={symbol.description}
                        className="size-12 rounded-full"
                    />

                    <h1 className="text-center text-2xl">Graphique pour {symbol.description}</h1>
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