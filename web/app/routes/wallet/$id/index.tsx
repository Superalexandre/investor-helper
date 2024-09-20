import type { MetaFunction } from "@remix-run/node"
import { ClientLoaderFunctionArgs, Form, Link, redirect, useLoaderData, useSubmit } from "@remix-run/react"
import getWalletById from "@/utils/getWallet"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Dispatch, FormEvent, SetStateAction, useMemo, useRef, useState } from "react"
import { normalizeSymbol, SearchSymbol, SelectSymbolType } from "@/components/selectSymbol"
import getPrices, { Period } from "@/utils/getPrices"
import { ClientOnly } from "remix-utils/client-only"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { WalletSymbol } from "../../../../../db/schema/users"
import getSymbolData, { RawSymbol } from "@/utils/getSymbol"
import { getUser } from "@/session.server"
import { MdArrowBack, MdDelete } from "react-icons/md"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SymbolLogo from "@/components/symbolLogo"

type FullSymbol = RawSymbol & WalletSymbol

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
    let moneyWin = 0

    const results = await Promise.all(
        walletSymbols.map(async (symbol) => {
            const [priceResult, symbolData] = await Promise.all([
                getPrices(symbol.symbol),
                getSymbolData(symbol.symbol)
            ])

            const price = priceResult.period
            const lastPrice = price[0]

            return {
                symbol,
                symbolData,
                lastPrice,
                price
            }
        })
    )

    // Traiter les résultats après résolution de toutes les promesses
    for (const { symbol, symbolData, lastPrice, price } of results) {
        walletValue += lastPrice.close * symbol.quantity
        moneyWin += (lastPrice.close - (symbol.buyPrice ?? 0)) * symbol.quantity

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
        prices: prices,
        moneyWin: moneyWin
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "Investor Helper - Votre portefeuille" },
        // { name: "description", content: "Welcome to Remix!" },
    ]
}

export function HydrateFallback() {
    return (
        <p>Chargement...</p>
    )
}

export default function Index() {
    const { walletValue, wallet, prices, moneyWin } = useLoaderData<typeof loader>()

    return (
        <div className="relative flex flex-col items-center justify-center">
            <Button asChild variant="default">
                <Link to="/profile" className="left-0 top-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute">
                    <MdArrowBack className="size-6" />

                    Retour
                </Link>
            </Button>

            <h1 className="pt-4 text-center text-2xl font-bold">
                {wallet.name}
            </h1>
            <p>{new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
            }).format(walletValue)} ({new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
            }).format(moneyWin)})</p>

            {/* <AddNotification /> */}

            <AddSymbols
                triggerText="Ajouter un symbole"
                walletId={wallet.walletId}
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
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full overflow-hidden">
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

                        <ChartLegend content={<ChartLegendContent />} />

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
                                                {(payload.payload.details as TotalPrices["details"]).map((detail, i) => (
                                                    <div key={`${detail.symbol}-${i}`} className="flex flex-row items-center gap-2">
                                                        {/* <div className="size-3 rounded-sm bg-[--color-close]"></div> */}
                                                        <SymbolLogo
                                                            symbol={detail}
                                                            alt=""
                                                            className="size-5 rounded-sm"
                                                            fallback={<div className="size-6"></div>}
                                                        />

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

export function AddSymbols({ triggerText, walletId }: { triggerText: string, walletId: string }) {
    const [selectedSymbol, setSelectedSymbol] = useState<SelectSymbolType[]>([])
    const [open, setOpen] = useState(false)
    const submit = useSubmit()

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const body = new FormData()

        body.append("walletId", walletId)

        for (const symbol of selectedSymbol) {
            body.append("symbol", JSON.stringify(symbol))
        }

        submit(body, {
            method: "post",
            replace: true,
            action: "/api/wallet/symbol/bulkAdd",
            navigate: false
        })


        setSelectedSymbol([])
        setOpen(false)
    }

    // overflow: hidden;
    // text-overflow: ellipsis;
    // white-space: nowrap;
    // width: 10%;
    // max-width: 130px;

    return (
        <Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <Form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <DialogHeader>
                        <DialogTitle>Composé votre portefeuille</DialogTitle>
                        <DialogDescription className="hidden">Ajouter des symboles à votre portefeuille</DialogDescription>
                    </DialogHeader>

                    <div className="flex max-h-96 flex-col overflow-auto">
                        {selectedSymbol.length > 0 ? selectedSymbol.map((symbol, i) => (
                            <div className="flex flex-row items-center gap-2" key={`${normalizeSymbol(symbol.symbol)}-${i}`}>
                                <SymbolLogo symbol={symbol} className="size-5 rounded-sm" />

                                <p>{normalizeSymbol(symbol.description)} ({normalizeSymbol(symbol.symbol)})</p>

                                <p>{symbol.quantity} action à {symbol.price} {symbol.currency_code}</p>

                                <Button
                                    variant="destructive"
                                    onClick={() => setSelectedSymbol((prev) => prev.filter((s) => s !== symbol))}
                                >
                                    <MdDelete />
                                </Button>
                            </div>
                        )) : null}
                    </div>

                    <FindSymbols
                        selectedSymbol={selectedSymbol}
                        setSelectedSymbol={setSelectedSymbol}
                        className="w-full"
                    />


                    <DialogFooter className="flex flex-row justify-center gap-2">
                        <Button
                            variant="default"
                            type="submit"
                            className="w-full"
                        >
                            Enregistrer
                        </Button>
                        <Button
                            variant="destructive"
                            type="reset"
                            className="w-full"
                            onClick={() => {
                                setSelectedSymbol([])
                                setOpen(false)
                            }}
                        >
                            Annuler
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>

    )
}

export function FindSymbols({
    setSelectedSymbol,
    className
}: {
    selectedSymbol: SelectSymbolType[],
    setSelectedSymbol: Dispatch<SetStateAction<SelectSymbolType[]>>,
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const [tempSelectedSymbol, setTempSelectedSymbol] = useState<SelectSymbolType>()

    const refQuantity = useRef<HTMLInputElement>(null)
    const refBuyPrice = useRef<HTMLInputElement>(null)

    const handleSave = () => {
        const price = parseFloat(refBuyPrice.current?.value || "0")
        const quantity = parseFloat(refQuantity.current?.value || "0")

        if (tempSelectedSymbol) {
            setSelectedSymbol((prev) => [...prev, {
                ...tempSelectedSymbol,
                price: price <= 0 ? 0 : price,
                quantity: quantity <= 0 ? 0 : quantity
            }])

            setTempSelectedSymbol(undefined)
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    onClick={() => setOpen(true)}
                    className={className}
                >
                    Ajouter un symbole
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rechercher une action, une crypto</DialogTitle>
                    <DialogDescription className="hidden">Rechercher un symbole</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <SearchSymbol
                        onClick={(symbol) => {
                            setTempSelectedSymbol(symbol)
                        }}
                        replace
                        required
                    />

                    <Label htmlFor="quantity">Quantité</Label>
                    <Input
                        type="number"
                        name="quantity"
                        placeholder="Quantité"
                        required
                        ref={refQuantity}
                        step="any"
                        min="0"
                    />

                    <Label htmlFor="buyPrice">Prix d'achat</Label>
                    <Input
                        type="number"
                        name="buyPrice"
                        placeholder="Prix d'achat"
                        required
                        ref={refBuyPrice}
                        step="any"
                        min="0"
                    />

                    <DialogFooter className="flex flex-row justify-center gap-2">
                        <Button
                            variant="default"
                            type="submit"
                            className="w-full"
                            onClick={handleSave}
                        >
                            Ajouter
                        </Button>
                        <Button
                            variant="destructive"
                            type="reset"
                            className="w-full"
                            onClick={() => setOpen(false)}
                        >
                            Annuler
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}