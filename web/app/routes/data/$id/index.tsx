import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, redirect, useActionData, useLoaderData, useSubmit } from "@remix-run/react"
import getPrices, { closeClient, type Period, type PeriodInfo } from "@/utils/getPrices"
import { ClientOnly } from "remix-utils/client-only"
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent
} from "@/components/ui/chart"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import getSymbolData from "@/utils/getSymbol"
// import { format } from "date-fns"
import { TZDate } from "@date-fns/tz"
import SymbolLogo from "@/components/symbolLogo"
import { type ComponentType, type ReactNode, useState } from "react"
import { Select } from "@/components/ui/select"
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fr } from "date-fns/locale"
import { format, formatDistanceStrict } from "date-fns"
import currencies from "@/lang/currencies"
import { useWindowSize } from "usehooks-ts"
import BackButton from "@/components/backButton"

function differences(prices: Period[]) {
	const differencePrice = prices[0].close - prices[prices.length - 1].close

	// Difference in percent can be up to 100% (double the price)
	const differencePercent = (differencePrice / prices[0].close) * 100

	const from = prices[0].time * 1000
	const to = prices[prices.length - 1].time * 1000

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

	const { period: prices, periodInfo: marketInfo } = await getPrices(params.id, {
		timeframe: "30",
		range: 192
	})

	closeClient()

	const symbol = await getSymbolData(params.id)

	if (!(symbol && prices && marketInfo)) {
		return redirect("/")
	}

	const { differencePrice, differencePercent, differenceTime } = differences(prices)

	const prettySymbol = currencies[symbol.currency]?.symbol_native ?? symbol.currency

	return {
		prices: prices.reverse(),
		symbol,
		prettySymbol,
		marketInfo,
		differencePrice,
		differencePercent,
		differenceTime
	}
}

export async function action({ params, request }: ActionFunctionArgs) {
	if (!params.id) {
		return redirect("/")
	}

	const body = await request.formData()
	if (!body.get("timeframe")) {
		return redirect("/")
	}

	const [timeframe, range] = body.get("timeframe")?.toString().split("-") ?? ["1D", "100"]

	const { period: prices, periodInfo: marketInfo } = await getPrices(params.id, {
		timeframe: timeframe as string,
		range: Number.parseInt(range)
	})

	closeClient()

	const { differencePrice, differencePercent, differenceTime } = differences(prices)

	return {
		prices: prices.reverse(),
		marketInfo,
		differencePrice,
		differencePercent,
		differenceTime
	}
}

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
	const title = `Investor Helper - Information sur ${data?.symbol.description}`
	const description = `Graphique des prix pour ${data?.symbol.description} sur le marché ${data?.marketInfo.name}. Dernier prix ${data?.prices[data?.prices.length - 1].close}${data?.prettySymbol}.`

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{
			name: "canonical",
			content: `https://investor-helper.com/data/${params.id}`
		},
		{ name: "robots", content: "noindex" }
	]
}

export default function Index() {
	const { prices, symbol, marketInfo, differencePrice, differencePercent, differenceTime, prettySymbol } =
		useLoaderData<typeof loader>()

	const data = useActionData<typeof action>()
	const submit = useSubmit()

	const diffPrice = data?.differencePrice ?? differencePrice
	const diffPercent = data?.differencePercent ?? differencePercent
	const diffTime = data?.differenceTime ?? differenceTime

	const isPositive = Number.parseInt(diffPrice) > 0

	const priceClass = isPositive ? "text-green-500" : "text-red-500"

	const formattedDiffPrice = `${isPositive ? "+" : ""}${diffPrice}`
	const formattedDiffPercent = `${isPositive ? "+" : ""}${diffPercent}%`

	const lastClose = data?.prices[data?.prices.length - 1].close ?? prices[prices.length - 1].close

	const handleSubmit = (value: string) => {
		const formData = new FormData()

		formData.append("timeframe", value)

		submit(formData, { method: "post" })
	}

	return (
		<div className="relative">
			<BackButton />

			<div className="flex flex-col items-center justify-center gap-4 pt-4">
				<div className="flex flex-col items-center justify-center gap-2 lg:flex-row">
					<SymbolLogo symbol={symbol} className="size-12 rounded-full" alt={symbol.description} />

					<h1 className="text-center text-2xl">Graphique pour {symbol.description}</h1>
				</div>

				<DisplaySession marketInfo={marketInfo} />

				<div className="flex flex-col items-center justify-center gap-2">
					<div className="flex flex-row items-center justify-center gap-1">
						<p className={priceClass}>
							{formattedDiffPrice}
							{prettySymbol} ({formattedDiffPercent})
						</p>
						<p>sur {diffTime}</p>
					</div>
				</div>

				<p>
					Dernier prix {lastClose}
					{prettySymbol}
				</p>
			</div>

			<Form className="flex w-full items-center justify-center lg:justify-start" method="POST">
				<div className="mx-4 w-80">
					<Select name="timeframe" defaultValue="30-192" onValueChange={(value) => handleSubmit(value)}>
						<SelectTrigger>
							<SelectValue placeholder="Choisir un intervalle" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1-360">Intervale 1 minutes sur 24h</SelectItem>
							<SelectItem value="1-720">Intervale 1 minutes sur 48h</SelectItem>

							<SelectItem value="30-48">Intervale 30min sur 24h</SelectItem>
							<SelectItem value="30-96">Intervale 30min sur 48h</SelectItem>
							<SelectItem value="30-144">Intervale 30min sur 72h</SelectItem>
							<SelectItem value="30-192">Intervale 30min sur 96h</SelectItem>

							<SelectItem value="60-24">Intervale 1h sur 24h</SelectItem>
							<SelectItem value="60-48">Intervale 1h sur 48h</SelectItem>
							<SelectItem value="60-72">Intervale 1h sur 72h</SelectItem>
							<SelectItem value="60-96">Intervale 1h sur 96h</SelectItem>

							<SelectItem value="120-12">Intervale 2h sur 24h</SelectItem>
							<SelectItem value="120-24">Intervale 2h sur 48h</SelectItem>
							<SelectItem value="120-36">Intervale 2h sur 72h</SelectItem>
							<SelectItem value="120-48">Intervale 2h sur 96h</SelectItem>

							<SelectItem value="120-85">Dernière semaine</SelectItem>
							<SelectItem value="1D-31">Dernier mois</SelectItem>
							<SelectItem value="1D-365">Dernière année</SelectItem>
							<SelectItem value="12M-100">Tout les temps</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</Form>

			<ClientOnly fallback={<p>Chargement...</p>}>
				{() => <FullChart prices={data?.prices ?? prices} />}
			</ClientOnly>
		</div>
	)
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor
function DisplaySession({ marketInfo }: { marketInfo: PeriodInfo }) {
	const [, city] = marketInfo.timezone.split("/")

	const sessionFrench: Record<string, string> = {
		regular: "Marché ouvert",
		premarket: "Pré-marché",
		postmarket: "Post-marché",
		extended: "Marché fermé"
	}

	const date = new TZDate(new Date(), marketInfo.timezone)
	const prettyDate = format(date, "HH:mm", {
		locale: fr
	})

	const orderSessions = ["premarket", "regular", "postmarket", "extended"]

	const orderedSessions = orderSessions
		.map((session) => {
			return marketInfo.subsessions.find((subsession) => subsession.id === session)
		})
		.filter((session) => session !== undefined)

	// Display the active session
	const activeSession =
		marketInfo.type !== "spot"
			? orderedSessions.find((session) => {
					if (!session) {
						return false
					}

					const [start, end] = session.session.split("-")
					const now = date.getHours() * 100 + date.getMinutes()

					return now >= Number.parseInt(start) && now <= Number.parseInt(end)
				})
			: orderedSessions[0]

	const regularSession = orderedSessions.find((session) => session.id === "regular") ?? orderedSessions[0]

	// Check if the market will open or close soon
	const typeFrench: Record<string, string> = {
		open: "Ouverture",
		close: "Fermeture"
	}
	const type = activeSession?.id === "regular" ? "close" : "open"

	// let timeUntil: number = 0
	let prettyTimeUntil = ""

	if (marketInfo.type !== "spot") {
		if (type === "open") {
			const [start] = regularSession.session.split("-")
			const marketOpen = Number.parseInt(start)

			const marketOpenHours = Math.floor(marketOpen / 100)
			const marketOpenMinutes = marketOpen % 100

			const currentHours = date.getHours()
			const currentMinutes = date.getMinutes()

			let hoursUntilOpen = marketOpenHours - currentHours
			let minutesUntilOpen = marketOpenMinutes - currentMinutes

			if (minutesUntilOpen < 0) {
				hoursUntilOpen -= 1
				minutesUntilOpen += 60
			}

			if (hoursUntilOpen < 0 || (hoursUntilOpen === 0 && minutesUntilOpen < 0)) {
				hoursUntilOpen += 24
			}

			// timeUntil = hoursUntilOpen * 60 + minutesUntilOpen
			prettyTimeUntil = `${hoursUntilOpen}h ${minutesUntilOpen}m`
		} else {
			const [, end] = regularSession.session.split("-")
			const marketClose = Number.parseInt(end)

			const marketCloseHours = Math.floor(marketClose / 100)
			const marketCloseMinutes = marketClose % 100

			const currentHours = date.getHours()
			const currentMinutes = date.getMinutes()

			let hoursRemaining = marketCloseHours - currentHours
			let minutesRemaining = marketCloseMinutes - currentMinutes

			if (minutesRemaining < 0) {
				hoursRemaining -= 1
				minutesRemaining += 60
			}

			// timeUntil = hoursRemaining * 60 + minutesRemaining
			prettyTimeUntil = `${hoursRemaining}h ${minutesRemaining}m`
		}
	}

	return (
		<div className="flex flex-col items-center justify-start">
			<p className="">
				Il est {prettyDate} à {city}
			</p>
			<p>Session active : {sessionFrench[activeSession?.id ?? "extended"]}</p>

			{prettyTimeUntil !== "" ? (
				<p>
					{typeFrench[type]} dans {prettyTimeUntil}
				</p>
			) : null}
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

function FullChart({ prices }: { prices: Period[] }) {
	const [displayVolume, setDisplayVolume] = useState(false)
	const { width = 0 } = useWindowSize()

	const isMobile = width < 640

	const chartConfig: FullConfig = {
		close: {
			label: "Prix",
			color: "hsl(var(--chart-1))"
		},
		time: {
			label: "Date"
		},
		volume: {
			label: "Volume",
			color: "hsl(var(--chart-2))",
			display: displayVolume,
			onClick: () => {
				setDisplayVolume(!displayVolume)
			}
		}
	}

	return (
		<ChartContainer config={chartConfig} className="min-h-[400px] w-full overflow-hidden lg:h-[500px] lg:min-h-0">
			<ComposedChart data={prices} accessibilityLayer={true}>
				<CartesianGrid vertical={false} />

				<XAxis
					hide={isMobile}
					dataKey="time"
					tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleString("fr-FR")}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					scale="auto"
				/>

				<YAxis
					hide={isMobile}
					dataKey="close"
					yAxisId="close"
					tickLine={false}
					axisLine={false}
					scale="auto"
					domain={[
						(dataMin: number) => Math.floor(dataMin * 0.85),
						(dataMax: number) => Math.ceil(dataMax * 1.05)
					]}
				/>

				<YAxis
					dataKey="volume"
					yAxisId="volume"
					orientation="right"
					hide={true}
					includeHidden={!displayVolume}
					domain={[
						(dataMin: number) => Math.floor(dataMin * 0.5),
						(dataMax: number) => Math.ceil(dataMax * 2)
					]}
				/>

				<Bar
					layout="vertical"
					yAxisId="volume"
					dataKey="volume"
					fill="var(--color-volume)"
					radius={8}
					hide={!displayVolume}
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
							labelFormatter={(_value, dataLabel) => {
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
	)
}
