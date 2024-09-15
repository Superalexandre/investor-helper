import type { MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, redirect, useLoaderData } from "@remix-run/react"
import getWalletById from "@/utils/getWallet"
// import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
// import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
// import { Card, CardContent } from "@/components/ui/card"
// import { ClientOnly } from "remix-utils/client-only"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import SelectSymbol, { Symbol } from "@/components/selectSymbol"
import getPrices from "@/utils/getPrices"

export async function loader({
    params
}: ClientLoaderFunctionArgs) {
    const { id } = params

    if (!id) return redirect("/")

    const { wallet, walletSymbols } = await getWalletById({ id: id })

    if (!wallet) return redirect("/")

    const prices = []
    let walletValue = 0

    for (const symbol of walletSymbols) {
        const price = await getPrices(symbol.symbol)
        const lastPrice = price[price.length - 1]

        walletValue += lastPrice.close * symbol.quantity

        prices.push(price)
    }

    return {
        walletValue: walletValue,
        wallet: wallet[0],
        walletSymbols: walletSymbols,
        prices: prices
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const { walletValue, wallet, walletSymbols, prices } = useLoaderData<typeof loader>()

    console.log(wallet, walletSymbols, prices)

    return (
        <div>
            <p>{wallet.name}</p>
            <p>{walletValue}€</p>

            <FindSymbols
                triggerText="Ajouter un symbole"
            />

            {/* <Card>
                <CardContent>
                    <ClientOnly fallback={<p>Chargement...</p>}>
                        {() => (
                            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                                <LineChart data={chartData}>
                                    <Line type="monotone" dataKey="value" stroke="#8884d8" />

                                    <CartesianGrid vertical={false} />

                                    <XAxis dataKey="name" />


                                    <ChartLegend content={<ChartLegendContent />} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </LineChart>
                            </ChartContainer>
                        )}
                    </ClientOnly>
                </CardContent>
            </Card> */}
        </div >
    )
}

export function FindSymbols({ triggerText }: { triggerText: string }) {
    const [selectedSymbol, setSelectedSymbol] = useState<Symbol[]>([])

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