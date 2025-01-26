import type { MetaFunction } from "react-router";
import {
    type ClientLoaderFunctionArgs,
    Form,
    Link,
    redirect,
    useLoaderData,
    useSubmit,
} from "react-router";
import getWalletById from "@/utils/getWallet"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { type Dispatch, type FormEvent, type SetStateAction, useRef, useState } from "react"
import { SearchSymbol, type SelectSymbolType } from "@/components/searchSymbol"
import getPrices, { closeClient, type Period } from "@/utils/getPrices"
import { ClientOnly } from "remix-utils/client-only"
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent
} from "@/components/ui/chart"
import { Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import type { WalletSymbol } from "../../../../../db/schema/users"
import getSymbolData, { type RawSymbol } from "@/utils/getSymbol"
import { getUser } from "@/session.server"
import { MdArrowBack, MdCalendarToday, MdDelete } from "react-icons/md"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SymbolLogo from "@/components/symbolLogo"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { format, formatDistanceStrict } from "date-fns"
import { fr } from "date-fns/locale"
import { normalizeSymbolHtml } from "@/utils/normalizeSymbol"

type FullSymbol = RawSymbol & WalletSymbol

export async function loader({ params, request }: ClientLoaderFunctionArgs) {
	const { id } = params

	if (!id) {
		return redirect("/")
	}

	const user = await getUser(request)
	if (!user) {
		return redirect("/")
	}

	const resultWallet = await getWalletById({ id: id, token: user.token })

	if (!resultWallet) {
		return redirect("/")
	}

	const { wallet, walletSymbols } = resultWallet

	const moneyInvested = walletSymbols.reduce((acc, symbol) => acc + (symbol.buyPrice ?? 0) * symbol.quantity, 0)
	const prices: { symbol: FullSymbol; data: Period[] }[] = []
	const totalPricesResult: TotalPrices[] = []

	let walletValue = 0
	let moneyWinFirst = 0
	let moneyWinLast = 0

	await Promise.all(
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function
		walletSymbols.map(async (symbol) => {
			if (!symbol.symbol || symbol.quantity <= 0) {
				return
			}

			const [priceResult, symbolData] = await Promise.all([
				getPrices(symbol.symbol, {
					timeframe: "1D",
					range: 21
				}),
				getSymbolData(symbol.symbol)
			])

			const buyAt = new Date(symbol.buyAt).getTime()
			const buyPrice = symbol.buyPrice ?? 0
			const price = priceResult.period

			// Firstprice is the first price of the period, we will find it end check if the symbol was bought at this time
			let firstPrice: Period | null = null
			// for (let i = 0; i < price.length; i++) {
			// 	if (price[i].time * 1000 <= buyAt) {
			// 		firstPrice = price[i]
			// 		break
			// 	}
			// }

			for (const p of price) {
				if (p.time * 1000 <= buyAt) {
					firstPrice = p
					break
				}
			}

			const lastPrice = price[0]
			const firstPriceClose = firstPrice?.close ?? price[price.length - 1].close

			walletValue += lastPrice.close * symbol.quantity

			moneyWinFirst += firstPriceClose * symbol.quantity
			moneyWinLast += lastPrice.close * symbol.quantity
			const moneyWin = lastPrice.close * symbol.quantity - firstPriceClose * symbol.quantity

			console.log({
				firstPriceFound: firstPrice?.close,
				symbol: symbol.symbol,
				firstResult: (firstPriceClose - buyPrice) * symbol.quantity,
				lastResult: (lastPrice.close - buyPrice) * symbol.quantity,
				moneyWin
			})

			prices.push({
				symbol: {
					...symbol,
					...symbolData
				} as FullSymbol,
				data: price
			})

			for (let i = 0; i < price.length; i++) {
				if (!totalPricesResult[i]) {
					const formattedTime = new Date(price[i].time * 1000)
					formattedTime.setHours(0, 0, 0, 0)

					totalPricesResult[i] = {
						time: formattedTime.getTime(),
						close: 0,
						volume: 0,
						performance: 0,
						details: []
					}
				}

				totalPricesResult[i].close += price[i].close * symbol.quantity
				totalPricesResult[i].volume += price[i].volume

				// Check time and win
				if (price[i].time * 1000 >= buyAt) {
					totalPricesResult[i].performance += (price[i].close - buyPrice) * symbol.quantity
					// totalPricesResult[i].performance += price[i].close * symbol.quantity
				}

				totalPricesResult[i].details.push({
					...symbolData,
					...symbol,
					price: price[i].close,
					value: price[i].close * symbol.quantity
				})
			}
		})
	)

	closeClient()

	// Get from to dates
	const from = prices.reduce(
		(acc, price) => {
			const first = price.data[price.data.length - 1].time
			return first < acc ? first : acc
		},
		prices.length > 0 ? prices[0].data[prices[0].data.length - 1].time : 0
	)

	const to = prices.reduce(
		(acc, price) => {
			const last = price.data[0].time
			return last > acc ? last : acc
		},
		prices.length > 0 ? prices[0].data[0].time : 0
	)

	const difference = formatDistanceStrict(from * 1000, to * 1000, {
		locale: fr
	})

	console.log({
		moneyWinLast,
		moneyWinFirst,
		result: moneyWinFirst - moneyWinLast,
		result2: moneyWinLast - moneyWinFirst
	})

	return {
		walletValue: walletValue,
		wallet: wallet,
		walletSymbols: walletSymbols,
		// prices: prices,
		moneyWin: moneyWinLast - moneyWinFirst,
		moneyInvested,
		difference,
		totalPrices: totalPricesResult.reverse()
	}
}

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Votre portefeuille"
	const description = ""

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description }
	]
}

export function HydrateFallback() {
	return <p>Chargement...</p>
}

export default function Index() {
	const { walletSymbols, walletValue, wallet, moneyInvested, moneyWin, difference, totalPrices } =
		useLoaderData<typeof loader>()

	return (
		<div className="relative flex flex-col items-center justify-center">
			<div className="w-full">
				<Button asChild={true} variant="default">
					<Link
						to="/profile"
						className="top-0 left-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
					>
						<MdArrowBack className="size-6" />
						Retour
					</Link>
				</Button>
			</div>

			<div className="flex flex-col gap-4">
				<h1 className="flex flex-col items-center pt-0 text-center font-bold text-2xl lg:pt-4">
					{wallet.name}

					<span className="font-normal text-base text-muted-foreground">{wallet.description}</span>
				</h1>

				<div className="flex flex-col justify-center gap-2">
					<div>
						<p className="text-center">Investissement total</p>
						<p className="text-center font-bold">
							{new Intl.NumberFormat("fr-FR", {
								style: "currency",
								currency: "EUR"
							}).format(moneyInvested)}
						</p>
					</div>

					<div>
						<p className="text-center">Gain total de votre portefeuille</p>
						<p className="flex flex-row items-center justify-center gap-2 text-center font-bold">
							{new Intl.NumberFormat("fr-FR", {
								style: "currency",
								currency: "EUR"
							}).format(walletValue)}

							<div>
								<span>(</span>
								<span
									className={`${walletValue - moneyInvested > 0 ? "text-green-500" : "text-red-500"}`}
								>
									{walletValue - moneyInvested < 0 ? "" : "+"}
									{new Intl.NumberFormat("fr-FR", {
										style: "currency",
										currency: "EUR"
									}).format(walletValue - moneyInvested)}
								</span>
								<span>)</span>
							</div>
						</p>
					</div>

					<div>
						<p className="text-center">Performance sur {difference}</p>
						<p className={`${moneyWin > 0 ? "text-green-500" : "text-red-500"} text-center font-bold`}>
							{moneyWin < 0 ? "" : "+"}
							{new Intl.NumberFormat("fr-FR", {
								style: "currency",
								currency: "EUR"
							}).format(moneyWin)}
						</p>
					</div>
				</div>
			</div>

			{/* <AddNotification /> */}

			<DialogAddSymbols triggerText="Ajouter un symbole" walletId={wallet.walletId} />

			<ChartWallet
				// prices={prices}
				walletSymbolsList={walletSymbols}
				totalPrices={totalPrices}
			/>
		</div>
	)
}

// interface Prices {
//     symbol: FullSymbol,
//     data: Period[]
// }

interface TotalPrices {
	time: number
	close: number
	volume: number
	details: Array<
		FullSymbol & {
			price: number
			value: number
		}
	>
	performance: number
}

export function ChartWallet({
	totalPrices,
	walletSymbolsList
}: { totalPrices: TotalPrices[]; walletSymbolsList: WalletSymbol[] }) {
	const chartConfig = {
		close: {
			label: "Prix",
			color: "hsl(var(--chart-1))"
		},
		time: {
			label: "Date"
		},
		volume: {
			label: "Volume",
			color: "hsl(var(--chart-2))"
		}
	} satisfies ChartConfig

	// const totalPrices = useMemo(() => {
	//     const totalPricesResult: TotalPrices[] = []

	//     return totalPricesResult.reverse()
	// }, [prices])

	return (
		<ClientOnly fallback={<p>Chargement...</p>}>
			{() => (
				<ChartContainer config={chartConfig} className="min-h-[200px] w-full overflow-hidden">
					<LineChart data={totalPrices}>
						<XAxis
							dataKey="time"
							tickFormatter={(timestamp) =>
								new Date(timestamp).toLocaleString("fr-FR", {
									day: "numeric",
									month: "short",
									year: "numeric"
								})
							}
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							scale="auto"
						/>

						<YAxis dataKey="performance" tickLine={false} axisLine={false} scale="auto" />

						<Line
							type="monotone"
							dataKey="performance"
							stroke="var(--color-close)"
							strokeWidth={2}
							dot={false}
						/>

						{walletSymbolsList.map((symbol) => {
							const x = new Date(symbol.buyAt)
							x.setHours(0, 0, 0, 0)

							return (
								<ReferenceLine
									key={x.getTime()}
									x={x.getTime()}
									stroke="red"
									label={() => <p>{`Achat de ${symbol.symbol}`}</p>}
								/>
							)
						})}

						<ChartLegend content={<ChartLegendContent />} />

						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									indicator="dot"
									labelFormatter={(_value, dataLabel) => {
										return new Date(dataLabel[0].payload.time).toLocaleString("fr-FR", {
											weekday: "long",
											day: "numeric",
											month: "short",
											year: "numeric"
											// hour: "numeric",
											// minute: "numeric",
										})
									}}
									formatter={(value, _name, payload) => {
										console.log(payload.payload.time)

										const time = new Date(payload.payload.time).getTime()

										return (
											<div className="flex flex-col gap-6">
												<div className="flex flex-row items-center gap-2">
													<div className="size-5 rounded-sm bg-[--color-close]" />
													<p className="font-bold">
														{new Intl.NumberFormat("fr-FR", {
															style: "currency",
															currency: "EUR"
														}).format(Number.parseFloat(value as string))}
													</p>
												</div>

												<div className="flex flex-col gap-2">
													{(payload.payload.details as TotalPrices["details"]).map(
														(detail, i) => (
															<div
																key={`${detail.symbol}-${i}`}
																className="flex flex-row items-center gap-2"
															>
																{/* <div className="size-3 rounded-sm bg-[--color-close]"></div> */}
																<SymbolLogo
																	symbol={detail}
																	alt=""
																	className="size-5 rounded-sm"
																	fallback={<div className="size-6" />}
																/>

																<p
																	className={`${new Date(detail.buyAt).getTime() >= time ? "text-red-500" : "text-green-500"}`}
																>
																	{detail.description} -
																	{new Intl.NumberFormat("fr-FR", {
																		style: "currency",
																		currency: "EUR"
																	}).format(detail.value)}
																</p>
															</div>
														)
													)}
												</div>
											</div>
										)
									}}
								/>
							}
						/>
					</LineChart>
				</ChartContainer>
			)}
		</ClientOnly>
	)
}

export function DialogAddSymbols({ triggerText, walletId }: { triggerText: string; walletId: string }) {
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
			<DialogTrigger asChild={true}>
				<Button variant="outline">{triggerText}</Button>
			</DialogTrigger>
			<DialogContent>
				<Form onSubmit={handleSubmit} className="flex flex-col gap-2">
					<DialogHeader>
						<DialogTitle>Composé votre portefeuille</DialogTitle>
						<DialogDescription className="hidden">
							Ajouter des symboles à votre portefeuille
						</DialogDescription>
					</DialogHeader>

					<div className="flex max-h-96 flex-col overflow-auto">
						{selectedSymbol.length > 0
							? selectedSymbol.map((symbol, i) => (
									<div
										className="flex flex-row items-center gap-2"
										key={`${normalizeSymbolHtml(symbol.symbol)}-${i}`}
									>
										<SymbolLogo symbol={symbol} className="size-5 rounded-sm" />

										<p>
											{normalizeSymbolHtml(symbol.description)} (
											{normalizeSymbolHtml(symbol.symbol)})
										</p>

										<p>
											{symbol.quantity} action à {symbol.price} {symbol.currency_code}
										</p>

										<Button
											variant="destructive"
											onClick={() =>
												setSelectedSymbol((prev) => prev.filter((s) => s !== symbol))
											}
										>
											<MdDelete />
										</Button>
									</div>
								))
							: null}
					</div>

					<FindSymbols
						selectedSymbol={selectedSymbol}
						setSelectedSymbol={setSelectedSymbol}
						className="w-full"
					/>

					<DialogFooter className="flex flex-row justify-center gap-2">
						<Button variant="default" type="submit" className="w-full">
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
	selectedSymbol: SelectSymbolType[]
	setSelectedSymbol: Dispatch<SetStateAction<SelectSymbolType[]>>
	className?: string
}) {
	const [open, setOpen] = useState(false)
	const [tempSelectedSymbol, setTempSelectedSymbol] = useState<SelectSymbolType>()
	const [date, setDate] = useState<Date>()

	const refQuantity = useRef<HTMLInputElement>(null)
	const refBuyPrice = useRef<HTMLInputElement>(null)

	const handleSave = () => {
		const price = Number.parseFloat(refBuyPrice.current?.value || "0")
		const quantity = Number.parseFloat(refQuantity.current?.value || "0")

		if (tempSelectedSymbol) {
			setSelectedSymbol((prev) => [
				...prev,
				{
					...tempSelectedSymbol,
					price: price <= 0 ? 0 : price,
					quantity: quantity <= 0 ? 0 : quantity,
					buyAt: date?.toISOString() ?? new Date().toISOString()
				}
			])

			setTempSelectedSymbol(undefined)
			setOpen(false)
			setDate(undefined)
		}
	}

	return (
		<Dialog open={open} onOpenChange={(openChange) => setOpen(openChange)}>
			<DialogTrigger asChild={true}>
				<Button variant="outline" onClick={() => setOpen(true)} className={className}>
					Ajouter un symbole
				</Button>
			</DialogTrigger>
			<DialogContent className="overflow-hidden">
				<DialogHeader>
					<DialogTitle>Rechercher une action, une crypto</DialogTitle>
					<DialogDescription className="hidden">Rechercher un symbole</DialogDescription>
				</DialogHeader>

				<div className="flex w-auto flex-col gap-4">
					<SearchSymbol
						onClick={(symbol) => {
							setTempSelectedSymbol(symbol)
						}}
						replace={true}
						required={true}
					/>

					<Label htmlFor="quantity">Quantité</Label>
					<Input
						type="number"
						name="quantity"
						placeholder="Quantité"
						required={true}
						ref={refQuantity}
						step="any"
						min="0"
					/>

					<Label htmlFor="buyPrice">Prix d'achat</Label>
					<Input
						type="number"
						name="buyPrice"
						placeholder="Prix d'achat"
						required={true}
						ref={refBuyPrice}
						step="any"
						min="0"
					/>

					<Label htmlFor="buyAt">Date d'achat</Label>
					<Popover>
						<PopoverTrigger asChild={true}>
							<Button
								variant="outline"
								className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
							>
								<MdCalendarToday className="mr-2 size-4" />
								{date ? format(date, "PPP") : <span>Date d'achat</span>}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								locale={fr}
								selected={date}
								onSelect={setDate}
								disabled={(dateValue) => {
									return dateValue > new Date() || dateValue < new Date("1970-01-01")
								}}
							/>
						</PopoverContent>
					</Popover>

					<DialogFooter className="flex flex-row justify-center gap-2">
						<Button variant="default" type="submit" className="w-full" onClick={handleSave}>
							Ajouter
						</Button>
						<Button variant="destructive" type="reset" className="w-full" onClick={() => setOpen(false)}>
							Annuler
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	)
}
