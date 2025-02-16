import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { Link, redirect, useParams } from "@remix-run/react"
import SymbolLogo from "@/components/symbolLogo"
import { type ReactNode, useCallback, useMemo, useState } from "react"
import BackButton from "@/components/button/backButton"
import { Button } from "../../../components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { ArrowDownIcon, ArrowUpIcon, BellIcon, BellPlusIcon, Currency, EllipsisVerticalIcon, ExternalLinkIcon, InfoIcon } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { getInfo } from "../../api/data/info"
import { FullChart } from "./Chart"
import { DialogInfo } from "./DialogInfo"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Details } from "./Details"
import { ConvertJsonToReact } from "../../../components/parseComponent"
import { cn } from "../../../lib/utils"
import type { NewsSymbols } from "../../../../types/News"
import currencies from "../../../../../lang/currencies"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu"
import CopyButton from "../../../components/button/copyButton"
import ShareButton from "../../../components/button/shareButton"
import DialogNotificationNews from "../../../components/dialog/dialogNotificationNews"
import AiAnalysis from "./AiAnalysis"

export const loader: LoaderFunction = async ({ params }) => {
	if (!params.id) {
		return redirect("/")
	}

	const info = await getInfo({ symbol: params.id })

	if (!info) {
		return null
	}

	const dataCurrency = info.currency as string
	const prettyCurrency = currencies[dataCurrency]?.symbol_native ?? dataCurrency

	return {
		name: info.description,
		price: info.close,
		currency: prettyCurrency
	}
}

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
	const title = `Investor Helper - Information sur ${data?.name ?? "l'entreprise"}`
	const description = `Graphique des prix pour ${data?.name ?? ""}. Dernier prix ${data?.price ?? ""}${data?.currency ?? ""}.`

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

export default function Index(): ReactNode {
	const params = useParams()

	const [openInfo, setOpenInfo] = useState(false)
	const [openNotification, setOpenNotification] = useState(false)

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
		error: boolean,
		info: {
			"Recommend.All|1W": number,
			description: string,
			country?: string,
			country_code_fund: string,
			isin?: string,
			exchange: string,
			name: string,
			change: number,
			close: number,
			"sector.tr"?: string,
			"industry.tr"?: string,
			prettyCurrency: string,
			currency: string
			type?: string,
			price_52_week_high: number,
			price_52_week_low: number,
			market_cap_basic?: number,
			"Pivot.M.Fibonacci.S3": number,
			"Pivot.M.Fibonacci.S2": number,
			"Pivot.M.Fibonacci.S1": number,
			"Pivot.M.Fibonacci.Middle": number,
			"Pivot.M.Fibonacci.R1": number,
			"Pivot.M.Fibonacci.R2": number,
			"Pivot.M.Fibonacci.R3": number,
			news: NewsSymbols[],
			additionalInfo: {
				symbol: {
					pro_symbol: string,
					aum?: number,
					ast_business_description: any
				}
			}
		}
	}>({
		queryKey: ["data", symbol],
		queryFn: async () => fetch(`/api/data/info?symbol=${symbol}`).then((res) => res.json()),
		refetchOnWindowFocus: true
	})

	console.log(data)

	if (isPending) {
		return (
			<div className="relative flex flex-col gap-4">
				<div className="relative flex w-full flex-row items-center justify-between">
					<BackButton />

					<Skeleton className="top-0 right-0 m-4 h-9 w-14 lg:absolute " />
				</div>

				<div className="flex flex-col items-center justify-center gap-4">
					<div className="flex max-w-full flex-col items-center justify-center gap-2 px-10 lg:flex-row">
						<Skeleton className="h-12 w-12 rounded-full" />

						<div className="flex flex-col items-center">
							<Skeleton className="h-5 w-80" />
						</div>
					</div>
					<div className="flex flex-row items-center justify-center gap-2">
						<Skeleton className="h-7 w-16" />

						<DisplayChange price={0} change={0} loading={isPending} currency="€" />
					</div>
				</div>
			</div>
		)
	}

	if (!data || data.error) {
		return <p>Symbol not found</p>
	}

	console.log(data.info.additionalInfo.symbol.pro_symbol)

	return (
		<div className="relative mb-4 flex flex-col gap-4">
			<div className="flex w-full flex-row items-center justify-evenly">
				<BackButton />

				<div className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-2 text-center lg:absolute">
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true} name="More options" aria-label="More options">
							<Button variant="ghost">
								<EllipsisVerticalIcon className="size-6" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mx-4">
							<DropdownMenuItem asChild={true} className="p-0">
								<Button
									variant="ghost"
									className="flex w-full flex-row items-center justify-start gap-2 p-6 pl-4 hover:cursor-pointer"
									onClick={(): void => setOpenInfo(true)}
								>
									Informations

									<InfoIcon />
								</Button>
							</DropdownMenuItem>

							<DropdownMenuItem asChild={true} className="p-0">
								<Button
									variant="ghost"
									className="flex w-full flex-row items-center justify-start gap-2 p-6 pl-4 hover:cursor-pointer"
									onClick={(): void => setOpenNotification(true)}
								>
									Notifications

									<BellPlusIcon />
								</Button>
							</DropdownMenuItem>

							<DropdownMenuItem asChild={true} className="p-0">
								<CopyButton
									content={`https://www.investor-helper.com/data/${data.info.additionalInfo.symbol.pro_symbol}`}
									copySuccess="Lien copié"
									copyError="Erreur lors de la copie"
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
							<DropdownMenuItem asChild={true} className="p-0">
								<ShareButton
									title={data.info.description}
									text={data.info.description}
									url={`https://www.investor-helper.com/data/${data.info.additionalInfo.symbol.pro_symbol}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<DialogNotificationNews
				open={openNotification}
				setOpen={setOpenNotification}
				type="create"
				groupName={data.info.description}
				keywords={[data.info.additionalInfo.symbol.pro_symbol]}
			/>

			<DialogInfo
				open={openInfo}
				setOpen={setOpenInfo}
				description={data.info.description}
				currency={data.info.currency}
				prettyCurrency={data.info.prettyCurrency}
				country={data.info.country}
				countryCode={data.info.country_code_fund}
				isin={data.info.isin}
				exchange={data.info.exchange}
				name={data.info.name}
				sector={data.info["sector.tr"]}
			/>

			<div className="flex flex-col items-center justify-center gap-4">
				<div className="flex max-w-full flex-col items-center justify-center gap-2 px-10 lg:flex-row">
					<SymbolLogo symbol={data.info} className="size-12 rounded-full" alt={data.info.description} />

					<div className="flex w-full flex-col items-center">
						<h1 className="w-full truncate font-bold">{data.info.description}</h1>
						{/* <p className="w-full truncate text-muted-foreground">{data.info.exchange} - {data.info.name}</p> */}
					</div>
				</div>
				<div className="flex flex-col flex-wrap items-center justify-center gap-2 lg:flex-row">
					{info.loading ? (
						<Skeleton className="h-7 w-16" />
					) : (
						<p className="font-bold text-xl">
							{new Intl.NumberFormat("fr-FR", data.info.currency ? {
								style: "currency",
								currency: data.info.currency,
								maximumFractionDigits: 2
							} : undefined).format(data.info.close)}
						</p>
					)}

					<DisplayChange price={info.price ?? data.info.close} change={info.change ?? data.info.change} loading={info.loading} currency={data.info.currency} />
				</div>
			</div>

			<Card className="mx-4 border-card-border">
				<CardContent className="m-6 flex flex-col gap-4 p-0">
					<FullChart
						symbol={symbol}
						currency={data.info.currency}
						setInfo={setInfo}

						// selectedPeriod={memoizedSelectedPeriod}
						// setSelectedPeriod={updateSelectedPeriod}
					/>

					<div className="flex w-full flex-row items-center justify-end">
						<Button asChild={true}>
							<Link to={`/compare?stocks=${symbol}`} className="flex flex-row items-center gap-2">
								<p>Comparer</p>

								<ExternalLinkIcon className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			{data.info.additionalInfo.symbol.ast_business_description || data.info["sector.tr"] || data.info["industry.tr"] ? (
				<Card className="mx-4 border-card-border">
					<CardHeader>
						<CardTitle className="text-lg">Information sur l'entreprise</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						{data.info.additionalInfo.symbol.ast_business_description ? (
							<ExpandableText text={data.info.additionalInfo.symbol.ast_business_description} />
						) : null}

						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{data.info["sector.tr"] ? (
								<div>
									<p className="font-semibold">Secteur</p>
									<p>{data.info["sector.tr"]}</p>
								</div>
							) : null}
							{data.info["industry.tr"] ? (
								<div>
									<p className="font-semibold">Industrie</p>
									<p>{data.info["industry.tr"]}</p>
								</div>
							) : null}
						</div>
					</CardContent>
				</Card>
			) : null}

			<div className="mx-4 flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
				{data.info.price_52_week_low || data.info.price_52_week_high ? (
					<Card className="w-full border-card-border">
						<CardHeader>
							<CardTitle>
								52 Week Range
							</CardTitle>
						</CardHeader>

						<CardContent>
							<div className="flex flex-wrap items-center justify-between">
								<span className="text-sm">Low: {data.info.price_52_week_low.toFixed(2)}</span>
								<span className="text-sm">High: {data.info.price_52_week_high.toFixed(2)}</span>
							</div>
							<div className="mt-2 h-2 rounded-full bg-secondary">
								<div
									className="h-full max-w-full rounded-full bg-primary"
									style={{
										width: `${((data.info.close - data.info.price_52_week_low) /
											(data.info.price_52_week_high - data.info.price_52_week_low)) *
											100
											}%`,
									}}
								/>
							</div>
						</CardContent>
					</Card>
				) : null}

				{data.info.market_cap_basic ? (
					<Card className="w-full border-card-border">
						<CardHeader>
							<CardTitle className="text-lg">Market Cap</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-bold text-2xl">{data.info.market_cap_basic.toLocaleString("fr-FR", {
								style: "currency",
								currency: data.info.currency,
								notation: "compact"
							})}</p>
						</CardContent>
					</Card>
				) : null}

				{!data.info.market_cap_basic && data.info.additionalInfo.symbol.aum ? (
					<Card className="w-full border-card-border">
						<CardHeader>
							<CardTitle className="text-lg">Actif sous gestion</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-bold text-2xl">{data.info.additionalInfo.symbol.aum.toLocaleString("fr-FR", {
								style: "currency",
								currency: data.info.currency,
								notation: "compact"
							})}</p>
						</CardContent>
					</Card>
				) : null}

				<DisplayRecommendation recommendation={data.info["Recommend.All|1W"]} />
			</div>

			{/* 
			<Card className="mx-4 border-card-border">
				<CardHeader>
					<CardTitle className="text-lg">Recommandation de l'IA</CardTitle>
				</CardHeader>
				<CardContent>
					<AiAnalysis symbol={symbol} />
				</CardContent>
			</Card> 
			*/}

			{data.info["Pivot.M.Fibonacci.S3"] && data.info["Pivot.M.Fibonacci.Middle"] && data.info["Pivot.M.Fibonacci.R3"] ? (
				<Card className="mx-4 border-card-border">
					<CardHeader>
						<CardTitle className="text-lg">Prévisions</CardTitle>
					</CardHeader>

					<CardContent>
						<div className="flex flex-wrap items-center justify-between">
							<span className="truncate text-sm">Low: {data.info["Pivot.M.Fibonacci.S3"].toFixed(2)}</span>
							<span className="truncate text-sm">Avg: {data.info["Pivot.M.Fibonacci.Middle"].toFixed(2)}</span>
							<span className="truncate text-sm">High: {data.info["Pivot.M.Fibonacci.R3"].toFixed(2)}</span>
						</div>
						<div className="mt-2 h-2 rounded-full bg-secondary">
							<div
								className="h-full max-w-full rounded-full bg-primary"
								style={{
									width: `${((data.info["Pivot.M.Fibonacci.Middle"] - data.info["Pivot.M.Fibonacci.S3"]) /
										(data.info["Pivot.M.Fibonacci.R3"] - data.info["Pivot.M.Fibonacci.S3"])) *
										100
										}%`,
								}}
							/>
						</div>
					</CardContent>
				</Card>
			) : null}

			{data.info.news.length > 0 ? (
				<Card className="mx-4 border-card-border">
					<CardHeader>
						<CardTitle className="text-lg">Dernières news pour {data.info.description}</CardTitle>
					</CardHeader>

					<CardContent className="flex flex-col gap-3">
						{data.info.news.map((news: NewsSymbols) => (
							<div key={news.news.id} className="flex flex-col">
								<Button variant="link" asChild={true} className="h-auto justify-start p-0">
									<Link to={`/news/${news.news.id}`} className="flex flex-row items-center gap-2">
										<h2 className="truncate font-bold">{news.news.title}</h2>

										<ExternalLinkIcon className="size-4 min-h-4 min-w-4" />
									</Link>
								</Button>

								<p className="text-muted-foreground text-sm">{new Date(news.news.published * 1000).toLocaleDateString("fr-FR", {
									month: "short",
									day: "numeric",
								})}</p>
							</div>
						))}
					</CardContent>
				</Card>
			) : null}

			{data.info.type && data.info.type === "fund" ? (
				<Card className="mx-4 border-card-border">
					<CardHeader>
						<CardTitle className="text-lg">ETF Composition</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center md:flex-row">
						<Details symbol={symbol} />
					</CardContent>
				</Card>
			) : null}
		</div>
	)
}

function ExpandableText({ text }: { text: string }): ReactNode {
	const [expanded, setExpanded] = useState(false)

	const handleExpand = (): void => {
		setExpanded(!expanded)
	}

	return (
		<div className="relative w-full">
			<p className={cn("line-clamp-2", { "line-clamp-none": expanded })}>
				<ConvertJsonToReact json={JSON.stringify(text)} />
			</p>

			<div className="mt-2 flex w-full flex-row justify-end">
				<Button variant="outline" onClick={handleExpand}>
					{expanded ? "Voir moins" : "Voir plus"}
				</Button>
			</div>
		</div>
	)
}

function DisplayRecommendation({ recommendation }: { recommendation: number }): ReactNode {
	const getRecommendationText = (value: number): string => {
		if (value >= 0.5) { return "Strong Buy"; }
		if (value >= 0.2) { return "Buy"; }
		if (value >= -0.2) { return "Neutral"; }
		if (value >= -0.5) { return "Sell"; }
		return "Strong Sell";
	}

	const color: Record<string, string> = {
		"Buy": "text-green-500",
		"Strong Buy": "text-green-500",
		"Neutral": "text-yellow-500",
		"Sell": "text-red-500",
		"Strong Sell": "text-red-500"
	}

	const recommendationText = getRecommendationText(recommendation)

	return (
		<Card className="w-full border-card-border">
			<CardHeader>
				<CardTitle className="text-lg">Recommendation</CardTitle>
			</CardHeader>
			<CardContent>
				<p
					className={cn("font-bold text-2xl", color[recommendationText])}
				>
					{recommendationText}
				</p>
			</CardContent>
		</Card>
	)
}

function DisplayChange({ currency, price, change, loading }: { currency: string, price: number, change: number, loading: boolean }): ReactNode {
	if (loading) {
		return (
			<Skeleton className="h-7 w-12" />
		)
	}

	const prettyPourcentage = new Intl.NumberFormat("fr-FR", {
		style: "percent",
		maximumFractionDigits: 2
	}).format(change / 100)

	const prettyPrice = new Intl.NumberFormat("fr-FR", currency ? {
		style: "currency",
		currency: currency,
		maximumFractionDigits: 2
	}: undefined).format(price * (change / 100))

	if (change > 0) {
		return (
			<div className="flex flex-row items-center justify-center gap-1 text-green-500">
				<ArrowUpIcon className="size-5" />

				<p className="text-sm">
					{prettyPrice} ({prettyPourcentage})
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-row items-center justify-center gap-1 text-red-500">
			<ArrowDownIcon className="size-5" />

			<p className="text-sm">
				{prettyPrice} ({prettyPourcentage})
			</p>
		</div>
	)
}