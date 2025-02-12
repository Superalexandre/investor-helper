import { Dialog, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "../ui/dialog"
import { Label } from "@/components/ui/label"
import { Form } from "@remix-run/react"
import { WalletIcon } from "lucide-react"
import { Switch } from "../ui/switch"

export default function NewWallet({
	className
}: {
	className?: string
}) {
	// const [open, setOpen] = useState(false)

	// const handleCreateWallet = (event: React.FormEvent<HTMLFormElement>) => {
	//     event.preventDefault()
	//     const form = event.currentTarget
	//     const formData = new FormData(form)
	//     // const walletName = formData.get("walletName") as string

	//     const normalizeSymbol = (symbol: string) => {
	//         return symbol.replace(/<[^>]*>/g, "")
	//     }
	//     // Add the selected symbol to the form data
	//     for (const symbol of selectedSymbol) {
	//         console.log(symbol)

	//         formData.append("symbol", `${symbol.exchange}:${normalizeSymbol(symbol.symbol)}`)
	//     }

	//     submit(formData, {
	//         method: "POST",
	//         action: "/api/wallet/create"
	//     })

	return (
		<Dialog>
			<DialogTrigger asChild={true}>
				<Button
					variant="default"
					className={className}
				>
					Créer un portefeuille

					<WalletIcon className="ml-2 h-6 w-6" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader className="pb-4">
					<DialogTitle>Créer un portefeuille</DialogTitle>
					<DialogDescription className="hidden">Créer un nouveau portefeuille</DialogDescription>
				</DialogHeader>

				<Form action="/api/wallet/create" method="POST">
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1">
							<Label htmlFor="walletName">Nom du portefeuille</Label>
							<Input type="text" name="walletName" placeholder="Nom du portefeuille" required={true} />
						</div>

						<div className="flex flex-col gap-1">
							<Label htmlFor="description">Description</Label>
							<Input type="text" name="description" placeholder="Description du portefeuille" />
						</div>

						<div className="flex flex-col gap-1">
							<Label>Visibilité du portefeuille</Label>
							<div className="flex flex-row items-center gap-4">
								<Label>Public</Label>
								<Switch name="private" />
								<Label>Privé</Label>
							</div>
						</div>
					</div>
					<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
						<DialogClose asChild={true}>
							<Button
								variant="destructive"
								// onClick={() => setOpen(false)}
								type="reset"
							>
								Fermer
							</Button>
						</DialogClose>
						<Button variant="default" type="submit">
							Créer
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
