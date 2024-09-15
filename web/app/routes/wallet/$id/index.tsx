import type { MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import getWalletById from "@/utils/getWallet"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { ClientOnly } from "remix-utils/client-only"
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

export async function loader() {
    const { wallet, walletSymbols } = await getWalletById({ id: "4b643adf-bed1-42d0-8e4a-d3ab917688ba" })

    return {
        wallet: wallet[0],
        walletSymbols: walletSymbols
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ]
}

export default function Index() {
    const { wallet, walletSymbols } = useLoaderData<typeof loader>()

    console.log(wallet, walletSymbols)

    const chartData = [
        {
            name: "Aujourd'hui",
            value: 4000,
            deepValue: "Nvidia : 3000\nAMD : 1000"
        },
        {
            name: "Hier",
            value: 3500,
            deepValue: "Nvidia : 3000\nAMD : 500"
        },
        {
            name: "Avant-hier",
            value: 3000,
            deepValue: "Nvidia : 3000\nAMD : 0"
        },
        {
            name: "Il y a 3 jours",
            value: 3000,
            deepValue: "Nvidia : 3000\nAMD : 0"
        },
        {
            name: "Il y a 4 jours",
            value: 2000,
            deepValue: "Nvidia : 2000\nAMD : 0"
        },
        {
            name: "Il y a 5 jours",
            value: 1000,
            deepValue: "Nvidia : 1000\nAMD : 0"
        },
        {
            name: "Il y a 6 jours",
            value: 3000,
            deepValue: "Nvidia : 3000\nAMD : 0"
        },
        {
            name: "Il y a 7 jours",
            value: 500,
            deepValue: "Nvidia : 500\nAMD : 0"
        },
        {
            name: "Il y a 8 jours",
            value: 0,
            deepValue: "Nvidia : 0\nAMD : 0"
        },
    ].reverse()


    const chartConfig = {
        name: {
            label: "Date",
            color: "#2563eb",
        },
    } satisfies ChartConfig


    return (
        <div>
            <p>{wallet.name}</p>

            <FindSymbols
                triggerText="Ajouter un symbole"
            />

            <Card>
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
            </Card>
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