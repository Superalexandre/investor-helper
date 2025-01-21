import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, redirect, useActionData, useLoaderData, useParams, useSubmit } from "@remix-run/react"
import getPrices, { closeClient, type Period, type PeriodInfo } from "@/utils/getPrices"
import { ClientOnly } from "remix-utils/client-only"
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent
} from "@/components/ui/chart"
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import getSymbolData from "@/utils/getSymbol"
// import { format } from "date-fns"
import { TZDate } from "@date-fns/tz"
import SymbolLogo from "@/components/symbolLogo"
import { type ComponentType, type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from "react"
import { Select } from "@/components/ui/select"
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fr } from "date-fns/locale"
import { format, formatDistanceStrict } from "date-fns"
import currencies from "@/lang/currencies"
import { useWindowSize } from "usehooks-ts"
import BackButton from "@/components/button/backButton"
import { Button } from "../../../components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { ColumnsArrayStock } from "../../../../utils/tradingview/filter"
import { Details } from "./Details"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from "lucide-react"
import { TriangleDownIcon, TriangleUpIcon } from "@radix-ui/react-icons"
import { Badge } from "../../../components/ui/badge"
import CopyButton from "../../../components/button/copyButton"
import { Skeleton } from "../../../components/ui/skeleton"
import { useTranslation } from "react-i18next"
import { getInfo } from "../../api/data/info"

function differences(prices: Period[]) {
	const lastItem = prices.at(-1) as Period
	const differencePrice = prices[0].close - lastItem.close

	// Difference in percent can be up to 100% (double the price)
	const differencePercent = (differencePrice / prices[0].close) * 100

	const from = prices[0].time * 1000
	const to = lastItem.time * 1000

	const differenceTime = formatDistanceStrict(from, to, {
		locale: fr
	})

	return {
		differencePrice: differencePrice.toFixed(2),
		differencePercent: differencePercent.toFixed(2),
		differenceTime
	}
}

export async function loader({ params }: LoaderFunctionArgs) {
	if (!params.id) {
		return redirect("/")
	}


	const info = await getInfo({ symbol: params.id })

	// const { period: prices, periodInfo: marketInfo } = await getPrices(params.id, {
	// 	timeframe: "30",
	// 	range: 192
	// })

	// closeClient()

	// const symbol = await getSymbolData(params.id)

	// if (!(symbol && prices && marketInfo)) {
	// 	return redirect("/")
	// }

	// const { differencePrice, differencePercent, differenceTime } = differences(prices)

	// const prettySymbol = currencies[symbol.currency]?.symbol_native ?? symbol.currency

	// return {
	// 	prices: prices.reverse(),
	// 	symbol,
	// 	prettySymbol,
	// 	marketInfo,
	// 	differencePrice,
	// 	differencePercent,
	// 	differenceTime
	// }
	return {
		name: info.description,
		price: info.close,
		currency: info.prettyCurrency
	}
}

// export async function action({ params, request }: ActionFunctionArgs) {
// 	if (!params.id) {
// 		return redirect("/")
// 	}

// 	const body = await request.formData()
// 	if (!body.get("timeframe")) {
// 		return redirect("/")
// 	}

// 	const [timeframe, range] = body.get("timeframe")?.toString().split("-") ?? ["1D", "100"]

// 	const { period: prices, periodInfo: marketInfo } = await getPrices(params.id, {
// 		timeframe: timeframe as string,
// 		range: Number.parseInt(range)
// 	})

// 	closeClient()

// 	const { differencePrice, differencePercent, differenceTime } = differences(prices)

// 	return {
// 		prices: prices.reverse(),
// 		marketInfo,
// 		differencePrice,
// 		differencePercent,
// 		differenceTime
// 	}
// }

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
	const title = `Investor Helper - Information sur ${data?.name}`
	const description = `Graphique des prix pour ${data?.name}. Dernier prix ${data?.price}${data?.currency}.`

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			name: "canonical",
			content: `https://www.investor-helper.com/data/${params.id}`
		}
		// { name: "robots", content: "noindex" }
	]
}

export default function Index() {
	const { t } = useTranslation()
	const params = useParams()

	const [open, setOpen] = useState(false)
	const [info, setInfo] = useState<{
		change?: number,
		price?: number,
		loading: boolean
	}>({
		change: undefined,
		price: undefined,
		loading: true
	})

	if (!params.id) {
		return <p>Symbol not found</p>
	}

	const symbol = params.id

	const {
		data,
		isPending,
		error,

	} = useQuery<{
		info: {
			description: string,
			country?: string,
			country_code_fund: string,
			isin?: string,
			exchange: string,
			name: string,
			change: number,
			close: number,
			"sector.tr"?: string,
			prettyCurrency: string,
			currency: string
		}
	}>({
		queryKey: [
			"data",
			{
				symbol: symbol
			}
		],
		queryFn: async () => {
			const req = await fetch(
				`/api/data/info?symbol=${symbol}`
			)
			const json = await req.json()

			// Fake loading
			// await new Promise((resolve) => setTimeout(resolve, 500_000))

			return json
		},
		refetchOnWindowFocus: true
	})

	console.log(data)

	if (isPending) {
		return (
			<div className="relative flex flex-col gap-4">
				<BackButton />

				<Button
					variant="ghost"
					className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-2 text-center lg:absolute"
					onClick={() => setOpen(true)}
				>
					<Skeleton className="h-full w-24" />
				</Button>

				<div className="flex flex-col items-center justify-center gap-4">
					<div className="flex max-w-full flex-col items-center justify-center gap-2 px-10 lg:flex-row">
						{/* <SymbolLogo symbol={data.info} className="size-12 rounded-full" alt={data.info.description} /> */}
						<Skeleton className="h-12 w-12 rounded-full" />

						<div className="flex flex-col items-center">
							{/* <h1 className="w-full truncate font-bold">{data.info.description}</h1> */}
							<Skeleton className="h-5 w-80" />
							{/* <p className="w-full truncate text-muted-foreground">{data.info.exchange} - {data.info.name}</p> */}
						</div>
					</div>
					<div className="flex flex-row items-center justify-center gap-2">
						<Skeleton className="h-5 w-16" />

						<DisplayChange price={0} change={0} loading={isPending} currency="€" />
					</div>
				</div>
			</div>
		)
	}

	if (!data) {
		return <p>Symbol not found</p>
	}

	return (
		<div className="relative flex flex-col gap-4">
			<BackButton />

			<Button
				variant="ghost"
				className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-2 text-center lg:absolute"
				onClick={() => setOpen(true)}
			>
				Info

				<InfoIcon />
			</Button>

			<Dialog open={open} onOpenChange={(newOpen) => setOpen(newOpen)}>
				<DialogContent className="max-h-full w-11/12 max-w-fit overflow-auto">
					<DialogHeader>
						<DialogTitle className="w-11/12 truncate">Info sur {data.info.description}</DialogTitle>
						<DialogDescription>
							Informations sur le symbol
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<div className="flex flex-row items-center gap-2">
							<p>Monnaie : {data.info.currency} {data.info.prettyCurrency}</p>

							<CopyButton content={data.info.currency} label={false} className="w-auto" />
						</div>


						{data.info.country ? (
							<div className="flex flex-row items-center gap-2">
								<p>Pays : {data.info.country} {data.info.country_code_fund}</p>

								<CopyButton content={data.info.country} label={false} className="w-auto" />
							</div>
						) : null}

						{data.info.isin ? (
							<div className="flex flex-row items-center gap-2">
								<p>ISIN : {data.info.isin}</p>

								<CopyButton content={data.info.isin} label={false} className="w-auto" />
							</div>
						) : null}

						<div className="flex flex-row items-center gap-2">
							<p>Exchange : {data.info.exchange}</p>

							<CopyButton content={data.info.exchange} label={false} className="w-auto" />
						</div>

						<div className="flex flex-row items-center gap-2">
							<p>Nom : {data.info.name} </p>

							<CopyButton content={data.info.name} label={false} className="w-auto" />
						</div>

						{data.info["sector.tr"] ? (
							<div className="flex flex-row items-center gap-2">
								<p>Secteur : {data.info["sector.tr"]}</p>

								<CopyButton content={data.info["sector.tr"]} label={false} className="w-auto" />
							</div>
						) : null}
					</div>
				</DialogContent>
			</Dialog>

			<div className="flex flex-col items-center justify-center gap-4">
				<div className="flex max-w-full flex-col items-center justify-center gap-2 px-10 lg:flex-row">
					<SymbolLogo symbol={data.info} className="size-12 rounded-full" alt={data.info.description} />

					<div className="flex flex-col items-center">
						<h1 className="w-full truncate font-bold">{data.info.description}</h1>
						{/* <p className="w-full truncate text-muted-foreground">{data.info.exchange} - {data.info.name}</p> */}
					</div>
				</div>
				<div className="flex flex-row items-center justify-center gap-2">
					{info.loading ? (
						<Skeleton className="h-5 w-16" />
					) : (
						<p className="font-bold text-xl">{data.info.close}{data.info.prettyCurrency}</p>
					)}

					<DisplayChange price={info.price ?? data.info.close} change={info.change ?? data.info.change} loading={info.loading} currency={data.info.prettyCurrency} />
				</div>
			</div>

			<FullChart
				symbol={symbol}
				setInfo={setInfo}
			/>

			{/* <Details symbol={symbol} /> */}
		</div>
	)
}

function DisplayChange({ currency, price, change, loading }: { currency: string, price: number, change: number, loading: boolean }): ReactNode {
	if (loading) {
		return (
			<Skeleton className="h-5 w-12" />
		)
	}

	if (change > 0) {
		return (
			<div className="flex flex-row items-center justify-center gap-1 text-green-500">
				<ArrowUpIcon className="size-5" />

				<p className="text-sm">
					{Number(price * (change / 100)).toFixed(2)}{currency} ({Number(change).toFixed(2)}%)
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-row items-center justify-center gap-1 text-red-500">
			<ArrowDownIcon className="size-5" />

			<p className="text-sm">
				{Number(price * (change / 100)).toFixed(2)}{currency} ({Number(change).toFixed(2)}%)
			</p>
		</div>
	)
}

function FullChart({ symbol, setInfo }: {
	symbol: string,
	setInfo: Dispatch<SetStateAction<{
		change?: number;
		price?: number;
		loading: boolean;
	}>>
}): ReactNode {
	const [timeframe, setTimeframe] = useState("1D")

	const {
		data,
		isPending,
		error
	} = useQuery<{
		prices: Period[],
		timeframe: string,
		range: number
	}>({
		queryKey: [
			"dataPrices",
			{
				symbol: symbol,
				timeframe: timeframe
			}
		],
		queryFn: async () => {
			const req = await fetch(
				`/api/data/prices?symbol=${symbol}&timeframe=${timeframe}`
			)
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	useEffect(() => {
		const firstPrice = data?.prices[0].close ?? 0
		const lastPrice = data?.prices.at(-1)?.close ?? 0

		const change = lastPrice - firstPrice
		const percentageChange = (change * 100) / (firstPrice || 1)

		setInfo({
			loading: isPending,
			change: percentageChange,
			price: lastPrice
		})
	}, [data, setInfo, isPending])

	if (isPending) {
		return <p>Loading...</p>
	}

	if (!data) {
		return <p>No prices</p>
	}

	const chartConfig: FullConfig = {
		close: {
			label: "Prix",
			color: "hsl(var(--chart-1))"
		},
		time: {
			label: "Date"
		}
	}

	const formatDate = (timestamp: number): string => {
		const date = new Date(timestamp * 1000)

		if (data.timeframe === "1D") {
			return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
		}

		if (data.timeframe === "1W" || data.timeframe === "1M") {
			return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
		}

		if (data.timeframe === "1Y" || data.timeframe === "all") {
			return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
		}

		return date.toLocaleString("fr-FR")
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-row items-center gap-1">
				<Button type="submit" className="" onClick={(): void => setTimeframe("1D")} variant={data.timeframe === "1D" ? "default" : "outline"}>
					1D
				</Button>
				<Button type="submit" className="" onClick={(): void => setTimeframe("1W")} variant={data.timeframe === "1W" ? "default" : "outline"}>
					1W
				</Button>
				<Button type="submit" className="" onClick={(): void => setTimeframe("1M")} variant={data.timeframe === "1M" ? "default" : "outline"}>
					1M
				</Button>
				<Button type="submit" className="" onClick={(): void => setTimeframe("1Y")} variant={data.timeframe === "1Y" ? "default" : "outline"}>
					1Y
				</Button>
				<Button type="submit" className="" onClick={(): void => setTimeframe("5Y")} variant={data.timeframe === "5Y" ? "default" : "outline"}>
					5Y
				</Button>
				<Button type="submit" className="" onClick={(): void => setTimeframe("all")} variant={data.timeframe === "all" ? "default" : "outline"}>
					All
				</Button>
			</div>

			<ChartContainer config={chartConfig} className="min-h-[400px] w-full overflow-hidden lg:h-[500px] lg:min-h-0">
				<ComposedChart data={data.prices} accessibilityLayer={true}>
					<CartesianGrid vertical={false} />

					<XAxis
						// hide={isMobile}
						dataKey="time"
						tickFormatter={formatDate}
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						scale="auto"
					/>

					<YAxis
						// hide={isMobile}
						dataKey="close"
						yAxisId="close"
						tickLine={false}
						axisLine={false}
						scale="auto"
						domain={[
							(dataMin: number) => Math.floor(dataMin * 0.85),
							(dataMax: number) => Math.ceil(dataMax * 1.05)
						]}
						tickMargin={0}
						allowDataOverflow={true}
					// tick={({ x, y, payload }) => {
					// 	return (
					// 		<text
					// 			// x={x + 15}
					// 			x={x}
					// 			y={y}
					// 			fill="currentColor"
					// 			fontSize="0.75rem"
					// 			textAnchor="end"
					// 			// Middle align
					// 			dy="0.32em"
					// 		>
					// 			{payload.value}
					// 		</text>
					// 	)
					// }}
					/>

					<Line
						yAxisId="close"
						dataKey="close"
						// type="basis"
						stroke="var(--color-close)"
						strokeWidth={2}
						dot={false}
						className="z-10"
					/>

					<ChartLegend
						content={
							<ChartLegendContent
								renderHidden={true}
								onClick={(item) => {
									const config = chartConfig[item.dataKey as string]

									if (config?.onClick) {
										config.onClick()
									}
								}}
							/>
						}
					/>
					<ChartTooltip
						cursor={false}
						content={
							<ChartTooltipContent
								indicator="dot"
								labelFormatter={(_value, dataLabel): string => {
									return new Date(dataLabel[0].payload.time * 1000).toLocaleString("fr-FR", {
										weekday: "long",
										day: "numeric",
										month: "short",
										year: "numeric",
										hour: "numeric",
										minute: "numeric"
									})
								}}
							/>
						}
					/>
				</ComposedChart>
			</ChartContainer>
		</div>
	)
}

interface FullConfig {
	[x: string]: {
		label?: ReactNode
		icon?: ComponentType
	} & (
		| {
			color?: string
			theme?: never
		}
		| {
			color?: never
			theme: Record<"light" | "dark", string>
		}
	) &
	(
		| {
			display?: boolean
			onClick?: () => void
		}
		| {
			display?: never
			onClick?: never
		}
	)
}
