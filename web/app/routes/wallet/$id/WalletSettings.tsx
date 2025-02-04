import { useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Input } from "../../../components/ui/input"
import { Switch } from "../../../components/ui/switch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast as sonner } from "sonner"
import Loading from "../../../components/loading"
import { useNavigate } from "@remix-run/react"

export default function WalletSettings({
    open,
    setOpen,
    walletId,
    name,
    description,
    isPrivate,
}: {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>,
    walletId: string,
    name: string,
    description: string,
    isPrivate: boolean,
}): ReactNode {
    const queryClient = useQueryClient()

    const [nameValue, setNameValue] = useState(name)
    const [descriptionValue, setDescriptionValue] = useState(description)
    const [privateValue, setPrivateValue] = useState(isPrivate)

    const mutation = useMutation({
        mutationKey: ["walletSettings", walletId],
        mutationFn: async ({ name, description, isPrivate }: { name: string, description: string, isPrivate: boolean }): Promise<string> => {
            console.log({
                walletId,
                name,
                description,
                isPrivate
            })

            const res = await fetch("/api/wallet/settings", {
                method: "POST",
                body: JSON.stringify({
                    walletId,
                    name,
                    description,
                    isPrivate
                })
            });

            return await res.json();
        },
        onSuccess: (): void => {
            queryClient.invalidateQueries({
                queryKey: ["wallet", walletId]
            }).then(() => {
                setOpen(false)

                sonner("Portefeuille mis à jour", {
                    description: "Les paramètres de votre portefeuille ont été mis à jour avec succès.",
                    closeButton: true,
                })
            })
        },
    })

    const handleSubmit = (event: FormEvent): void => {
        event.preventDefault()

        mutation.mutate({
            name: nameValue,
            description: descriptionValue,
            isPrivate: privateValue
        })
    }

    return (
        <Dialog open={open} onOpenChange={(openChange): void => setOpen(openChange)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Paramètres de votre portefeuille</DialogTitle>
                    <DialogDescription>
                        Vous pouvez modifier les paramètres de votre portefeuille ici.
                    </DialogDescription>
                </DialogHeader>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1">
                        <Label>Nom du portefeuille</Label>
                        <Input
                            name="name"
                            placeholder="Nom du portefeuille"
                            defaultValue={name}
                            onChange={(event): void => setNameValue(event.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Description</Label>
                        <Input
                            name="description"
                            placeholder="Description"
                            defaultValue={description}
                            onChange={(event): void => setDescriptionValue(event.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Visibilité du portefeuille</Label>
                        <div className="flex flex-row items-center gap-4">
                            <Label>Public</Label>
                            <Switch
                                name="visibility"
                                defaultChecked={isPrivate}
                                onCheckedChange={(checked): void => setPrivateValue(checked)}
                            />
                            <Label>Privé</Label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Supprimer le portefeuille</Label>
                        <DeleteWallet walletId={walletId} />
                    </div>

                    <DialogFooter className="flex flex-row justify-center gap-2">
                        <Button
                            variant="destructive"
                            type="reset"
                            className="w-full"
                            onClick={(): void => setOpen(false)}
                        >
                            Fermer
                        </Button>
                        <Button
                            variant="default"
                            type="submit"
                            className="w-full"
                        >
                            Enregistrer

                            {/* {mutation.isPending ? <Loading className="size-4 border-2 text-secondary" /> : null} */}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

    )
}

function DeleteWallet({ walletId }: { walletId: string }): ReactNode {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const mutation = useMutation({
        mutationKey: ["walletDelete", walletId],
        mutationFn: async ({ walletId }: { walletId: string }): Promise<string> => {
            console.log({
                walletId
            })

            const res = await fetch("/api/wallet/delete", {
                method: "POST",
                body: JSON.stringify({
                    walletId
                })
            });

            return await res.json();
        },
        onSuccess: (): void => {
            queryClient.invalidateQueries({
                queryKey: ["wallet", walletId]
            }).then(() => {
                navigate("/profile")

                sonner("Portefeuille supprimé", {
                    description: "Votre portefeuille a été supprimé avec succès.",
                    closeButton: true,
                })
            })
        },
    })

    return (
        <Button
            type="button"
            variant="destructive"
            onClick={(): void => mutation.mutate({ walletId })}
        >
            Supprimer
        </Button>
    )
}