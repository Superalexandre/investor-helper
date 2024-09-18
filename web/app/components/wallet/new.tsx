import { Dialog, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DialogClose, DialogContent, DialogFooter, DialogHeader } from "../ui/dialog"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { SelectSymbolType } from "../selectSymbol"
import { Form, useSubmit } from "@remix-run/react"

export default function NewWallet() {
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
            <DialogTrigger>
                <Button variant="default">Créer un portefeuille</Button>
            </DialogTrigger>
            <DialogContent>
                <Form 
                    action="/api/wallet/create" 
                    method="POST"
                >
                    <DialogHeader className="pb-4">
                        <DialogTitle>Créer un portefeuille</DialogTitle>
                        {/* <DialogDescription>Créer un nouveau portefeuille</DialogDescription> */}
                    </DialogHeader>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="walletName">Nom du portefeuille</Label>
                            <Input
                                type="text"
                                name="walletName"
                                placeholder="Nom du portefeuille"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                type="text"
                                name="description"
                                placeholder="Description du portefeuille"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="default" 
                            type="submit"
                        >
                            Créer
                        </Button>
                        <DialogClose asChild>
                            <Button 
                                variant="destructive" 
                                // onClick={() => setOpen(false)}
                                type="reset"
                            >
                                Fermer
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    )
}