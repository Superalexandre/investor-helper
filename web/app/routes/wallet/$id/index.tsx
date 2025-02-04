import type { MetaFunction } from "@remix-run/node"
import { Form, redirect, useParams } from "@remix-run/react"
import { Button } from "@/components/ui/button"
import React, { useState, type FormEvent } from "react"
import type { Wallet, WalletSymbol } from "../../../../../db/schema/users"
import { useMutation, useQuery } from "@tanstack/react-query"
import { WalletData } from "./WalletData"
import BackButton from "../../../components/button/backButton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu"
import { EllipsisVerticalIcon, FileUpIcon, SettingsIcon } from "lucide-react"
import CopyButton from "../../../components/button/copyButton"
import ShareButton from "../../../components/button/shareButton"
import { toast as sonner } from "sonner"
import WalletSettings from "./WalletSettings"

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
	const [openSettings, setOpenSettings] = useState(false)
	const params = useParams()

	if (!params.id) {
		return redirect("/")
	}

	const {
		data,
		isPending,
	} = useQuery<{
		error: boolean,
		success: boolean,
		message: string,
		data: {
			isOwner: boolean,
			wallet: Wallet,
			walletSymbols: WalletSymbol[]
		}
	}>({
		queryKey: ["wallet", params.id],
		queryFn: () => fetch(`/api/wallet/info?walletId=${params.id}`).then((res) => res.json()),
		refetchOnWindowFocus: true
	})

	if (isPending) {
		return <p>Chargement...</p>
	}

	if (!data || data.error) {
		return <p>{data?.message ?? "Une erreur est survenue"}</p>
	}

	const isOwner = data.data.isOwner

	return (
		<div className="relative flex flex-col items-center justify-center">
			{isOwner ? (
				<WalletSettings 
					open={openSettings} 
					setOpen={setOpenSettings}
					walletId={data.data.wallet.walletId}
					name={data.data.wallet.name}
					description={data.data.wallet.description || ""}
					isPrivate={data.data.wallet.private}
				/>
			) : null}

			<div className="flex w-full flex-row items-center justify-evenly">
				<BackButton fallbackRedirect="/profile" label="Retour" />

				<div className="top-0 right-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute">
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true} name="More options" aria-label="More options">
							<Button variant="ghost">
								<EllipsisVerticalIcon className="size-6" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mx-4">
							<DropdownMenuItem asChild={true} className="p-0">
								{isOwner ? (
									<Button 
										variant="ghost" 
										className="flex w-full flex-row items-center justify-start gap-2 p-6 pl-4 hover:cursor-pointer"
										onClick={(): void => setOpenSettings(true)}
									>
										Paramètres

										<SettingsIcon className="size-5" />
									</Button>

								) : null}
							</DropdownMenuItem>
							<DropdownMenuItem asChild={true} className="p-0">
								<ExportWallet walletId={data.data.wallet.walletId} />
							</DropdownMenuItem>
							<DropdownMenuItem asChild={true} className="p-0">
								<CopyButton
									content={`https://www.investor-helper.com/wallet/${data.data.wallet.walletId}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
							<DropdownMenuItem asChild={true} className="p-0">
								<ShareButton
									title={data.data.wallet.name}
									text={data.data.wallet.description || data.data.wallet.name}
									url={`https://www.investor-helper.com/wallet/${data.data.wallet.walletId}`}
									className="p-6 pl-4 hover:cursor-pointer"
								/>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="flex w-full flex-col gap-4 px-4 lg:w-1/2 lg:p-0">
				<div className="flex w-full flex-col items-center justify-center gap-2 pt-0 lg:pt-4">
					<h1 className="w-full truncate text-center font-bold text-2xl">
						{data.data.wallet.name}
					</h1>

					<span className="w-full truncate text-center font-normal text-base text-muted-foreground">{data.data.wallet.description}</span>
				</div>
			</div>

			<WalletData walletId={params.id} />
		</div>
	)
}

const ExportWallet = React.forwardRef<HTMLButtonElement, { walletId: string }>(
	({ walletId }, ref) => {
		const mutation = useMutation({
			mutationFn: (): Promise<string> => fetch(`/api/wallet/export?walletId=${walletId}`).then((res) => res.json()),
			onSuccess: (data): void => {
				const blob = new Blob([data], { type: "application/json" })
				const url = URL.createObjectURL(blob)
				const a = document.createElement("a")
				a.href = url
				a.download = `wallet-${walletId}.json`
				a.click()

				sonner("Export réussi", {
					description: "Le portefeuille a été exporté avec succès",
					closeButton: true
				})
			}
		})

		const handleExport = (event: FormEvent): void => {
			event.preventDefault()
			mutation.mutate()
		}

		return (
			<Form onSubmit={handleExport} className="flex flex-col gap-2">
				<Button
					ref={ref}
					variant="ghost"
					className="flex w-full flex-row items-center justify-start gap-2 p-6 pl-4 hover:cursor-pointer"
				>
					Exporter

					<FileUpIcon className="size-5" />
				</Button>
			</Form>
		)
	})