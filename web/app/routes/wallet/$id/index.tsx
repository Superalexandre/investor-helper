import type { MetaFunction } from "@remix-run/node"
import { type ClientLoaderFunctionArgs, Form, Link, redirect, useLoaderData, useParams, useSubmit } from "@remix-run/react"
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
import { type Dispatch, type FormEvent, ReactNode, type SetStateAction, useRef, useState } from "react"
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
import type { Wallet, WalletSymbol } from "../../../../../db/schema/users"
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
import { useQuery } from "@tanstack/react-query"
import { WalletData } from "./WalletData"

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

export default function Index() {
	const params = useParams()

	if (!params.id) {
		return redirect("/")
	}

	const {
		data,
		isPending,
		error,
	} = useQuery<{
		data: {
			wallet: Wallet,
			walletSymbols: WalletSymbol[]
		}
	}>({
		queryKey: ["wallet", params.id],
		queryFn: async () => {
			const req = await fetch(
				`/api/wallet/info?walletId=${params.id}`
			)
			const json = await req.json()

			// Fake loading
			// await new Promise((resolve) => setTimeout(resolve, 500_000))

			return json
		},
		refetchOnWindowFocus: true
	})

	if (isPending) {
		return <p>Chargement...</p>
	}

	if (!data) {
		return <p>Erreur</p>
	}

	return (
		<div className="relative flex flex-col items-center justify-center">
			<div className="flex w-full flex-row items-center justify-between">
				<Button asChild={true} variant="default">
					<Link
						to="/profile"
						className="top-0 left-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
					>
						<MdArrowBack className="size-6" />
						Retour
					</Link>
				</Button>

				<Button variant="outline" className="top-0 right-0 m-4 lg:absolute">
					Paramètres
				</Button>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex w-full flex-col items-center justify-center gap-2 pt-0 lg:pt-4">
					<h1 className="text-center font-bold text-2xl">
						{data.data.wallet.name}
					</h1>

					<span className="font-normal text-base text-muted-foreground">{data.data.wallet.description}</span>
				</div>
			</div>

			<WalletData walletId={params.id} />
		</div>
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
