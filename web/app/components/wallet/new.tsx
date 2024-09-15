import { Dialog, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DialogClose, DialogContent, DialogFooter, DialogHeader } from "../ui/dialog"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import SelectSymbol, { Symbol } from "../selectSymbol"

export default function NewWallet() {
    const [open, setOpen] = useState(false)
    const [walletName, setWalletName] = useState("")
    const [selectedSymbol, setSelectedSymbol] = useState<Symbol[]>([])
    
    return (
        <Dialog open={open}>
            <DialogTrigger>
                <Button variant="default" onClick={() => setOpen(true)}>Créer un portefeuille</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer un portefeuille</DialogTitle>
                    {/* <DialogDescription>Créer un nouveau portefeuille</DialogDescription> */}
                </DialogHeader>
                <div>
                    <Label htmlFor="walletName">Nom du portefeuille</Label>
                    <Input
                        type="text"
                        name="walletName"
                        placeholder="Nom du portefeuille"
                        value={walletName}
                        onChange={(e) => setWalletName(e.target.value)}
                    />

                    <SelectSymbol 
                        selectedSymbol={selectedSymbol}
                        setSelectedSymbol={setSelectedSymbol}
                    />
                </div>
                <DialogFooter>
                    <Button variant="default" onClick={() => {
                        console.log(walletName)
                        setOpen(false)
                    }}>
                        Créer
                    </Button>
                    <DialogClose asChild>
                        <Button variant="destructive" onClick={() => setOpen(false)}>Fermer</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )


}