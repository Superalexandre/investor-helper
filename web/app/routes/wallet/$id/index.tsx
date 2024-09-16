import type { MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, redirect, useLoaderData } from "@remix-run/react"
import getWalletById from "@/utils/getWallet"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"
import SelectSymbol, { Symbol as SymbolSelect } from "@/components/selectSymbol"
import getPrices, { Period } from "@/utils/getPrices"
import { ClientOnly } from "remix-utils/client-only"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { WalletSymbol } from "../../../../../db/schema/users"
import getSymbolData, { Symbol } from "@/utils/getSymbol"
import { getUser } from "@/session.server"

type FullSymbol = Symbol & WalletSymbol

export async function loader({
    params,
    request
}: ClientLoaderFunctionArgs) {
    const { id } = params

    if (!id) return redirect("/")

    const user = await getUser(request)
    if (!user) return redirect("/")

    const resultWallet = await getWalletById({ id: id, token: user.token })

    if (!resultWallet) return redirect("/")

    const { wallet, walletSymbols } = resultWallet

    const prices = []
    let walletValue = 0

    for (const symbol of walletSymbols) {
        const [priceResult, symbolData] = await Promise.all([
            getPrices(symbol.symbol),
            getSymbolData(symbol.symbol)
        ])

        const price = priceResult.period
        const lastPrice = price[price.length - 1]

        walletValue += lastPrice.close * symbol.quantity

        prices.push({
            symbol: {
                ...symbol,
                ...symbolData
            } as FullSymbol,
            data: price
        })
    }

    return {
        walletValue: walletValue,
        wallet: wallet,
        walletSymbols: walletSymbols,
        // prices: prices,
        prices: prices,
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export function HydrateFallback() {
    return <p>Loading Game...</p>
}

export default function Index() {
    const { walletValue, wallet, prices } = useLoaderData<typeof loader>()

    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="pt-4 text-center text-2xl font-bold">
                {wallet.name}
            </h1>
            <p>{new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
            }).format(walletValue)}</p>

            {/* <AddNotification /> */}

            <FindSymbols
                triggerText="Ajouter un symbole"
            />

            <ChartWallet prices={prices} />
        </div>
    )
}

interface Prices {
    symbol: FullSymbol,
    data: Period[]
}

interface TotalPrices {
    time: number,
    close: number,
    volume: number,
    details: Array<FullSymbol & {
        price: number,
        value: number
    }>
}

export function ChartWallet({ prices }: { prices: Prices[] }) {
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

    const totalPrices = useMemo(() => {
        const totalPricesResult: TotalPrices[] = []

        for (const price of prices) {
            for (let i = 0; i < price.data.length; i++) {
                if (!totalPricesResult[i]) {
                    totalPricesResult[i] = {
                        time: price.data[i].time,
                        close: 0,
                        volume: 0,
                        details: []
                    }
                }

                totalPricesResult[i].close += price.data[i].close * price.symbol.quantity
                totalPricesResult[i].volume += price.data[i].volume

                totalPricesResult[i].details.push({
                    ...price.symbol,
                    price: price.data[i].close,
                    value: price.data[i].close * price.symbol.quantity
                })
            }
        }

        return totalPricesResult.reverse()
    }, [prices])

    return (
        <ClientOnly fallback={<p>Chargement...</p>}>
            {() => (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <LineChart data={totalPrices}>

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
                            tickLine={false}
                            axisLine={false}
                            scale="auto"
                            // scale="linear"
                        />

                        <Line
                            type="natural"
                            dataKey="close"
                            stroke="var(--color-close)"
                            strokeWidth={2}
                            dot={false}
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

                                formatter={(value, name, payload) => {
                                    return (
                                        <div className="flex flex-col gap-6">
                                            <div className="flex flex-row items-center gap-2">
                                                <div className="size-5 rounded-sm bg-[--color-close]"></div>
                                                <p className="font-bold">
                                                    {new Intl.NumberFormat("fr-FR", {
                                                        style: "currency",
                                                        currency: "EUR",
                                                    }).format(parseFloat(value as string))}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {(payload.payload.details as TotalPrices["details"]).map((detail) => (
                                                    <div key={detail.symbol} className="flex flex-row items-center gap-2">
                                                        {/* <div className="size-3 rounded-sm bg-[--color-close]"></div> */}
                                                        {detail.logoid ? (
                                                            <img src={"https://s3-symbol-logo.tradingview.com/" + detail.logoid + ".svg"} alt="" className="size-5 rounded-sm" />
                                                        ) : <div className="size-6"></div>}

                                                        <p>
                                                            {detail.description} - {new Intl.NumberFormat("fr-FR", {
                                                                style: "currency",
                                                                currency: "EUR",
                                                            }).format(detail.value)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }}
                            />}
                        />
                    </LineChart>
                </ChartContainer>
            )}
        </ClientOnly>
    )

}

export function FindSymbols({ triggerText }: { triggerText: string }) {
    const [selectedSymbol, setSelectedSymbol] = useState<SymbolSelect[]>([])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>Rechercher une action, une crypto</DialogTitle>
                </DialogHeader>

                <SelectSymbol
                    selectedSymbol={selectedSymbol}
                    setSelectedSymbol={setSelectedSymbol}
                />
            </DialogContent>
        </Dialog>

    )
}

// function AddNotification() {
//     const { subscribeToPush, unsubscribeFromPush, isSubscribed } = usePush()

//     return (
//         <Button onClick={() => {
//             if (isSubscribed) {
//                 unsubscribeFromPush()
//             } else {
// eslint-disable-next-line no-secrets/no-secrets
//                 subscribeToPush("BJouhfY2UXQNQmTRWEUEqPtQZxbwblA7qbqKpN_V1ylIApWybUF-gpaN3IfZI2LVVRpzKSwv2nUg-RWOH8yGvjw", (subscription) => {
//                     console.log("User subscribed to push notifications!", subscription)
//                     fetch("/api/subscribe", {
//                         method: "POST",
//                         headers: {
//                             "Content-Type": "application/json"
//                         },
//                         body: JSON.stringify(subscription)
//                     })
//                 }, (error) => {
//                     console.error("Error subscribing user to push notifications!", error)
//                 })
//             }
//         }}>
//             {isSubscribed ? "Unsubscribe" : "Subscribe"}
//         </Button>
//     )
// }