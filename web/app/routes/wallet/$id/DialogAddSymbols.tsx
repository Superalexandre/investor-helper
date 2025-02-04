import { Form } from "@remix-run/react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { normalizeSymbolHtml } from "../../../../utils/normalizeSymbol";
import SymbolLogo from "../../../components/symbolLogo";
import { CalendarIcon, TrashIcon } from "lucide-react";
import { SearchSymbol, type SelectSymbolType } from "../../../components/searchSymbol";
import { type Dispatch, type FormEvent, type SetStateAction, useRef, useState } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Calendar } from "../../../components/ui/calendar";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import { fr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as sonner } from "sonner";
import { Checkbox } from "../../../components/ui/checkbox";

export function DialogAddSymbols({ triggerText, walletId }: { triggerText: string; walletId: string }) {
    const [selectedSymbol, setSelectedSymbol] = useState<SelectSymbolType[]>([])
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (): Promise<string> => {
            const res = await fetch("/api/wallet/symbol/bulkAdd", {
                method: "POST",
                body: JSON.stringify({
                    walletId,
                    symbols: selectedSymbol
                })
            });

            return await res.json();
        },
        onSuccess: (): void => {
            setSelectedSymbol([])
            setOpen(false)

            queryClient.invalidateQueries({
                queryKey: ["walletPrice", walletId]
            }).then(() => {
                sonner("Symboles ajoutées", {
                    description: "Les symboles ont été ajoutées à votre portefeuille",
                    closeButton: true
                })
            })
        }
    })

    const handleSubmit = (event: FormEvent): void => {
        event.preventDefault()
        mutation.mutate()
    }

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
                                        onClick={(): void => {
                                            setSelectedSymbol((prev) => prev.filter((s) => s !== symbol))
                                        }}
                                    >
                                        <TrashIcon className="size-5" />
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
                        <Button
                            variant="destructive"
                            type="reset"
                            className="w-full"
                            onClick={(): void => {
                                setSelectedSymbol([])
                                setOpen(false)
                            }}
                        >
                            Annuler
                        </Button>
                        <Button variant="default" type="submit" className="w-full">
                            Enregistrer
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

    const handleSave = (): void => {
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

    const prefix = tempSelectedSymbol?.prefix?.toUpperCase() ?? tempSelectedSymbol?.exchange?.toUpperCase()
    const fullName = `${prefix}:${normalizeSymbolHtml(tempSelectedSymbol?.symbol || "")}`

    const price = useMutation({
        mutationKey: ["data", fullName],
        mutationFn: async () => fetch(`/api/data/info?symbol=${fullName}`).then((res) => res.json())
    })

    console.log("Price", price.data, tempSelectedSymbol, fullName)

    return (
        <Dialog open={open} onOpenChange={(openChange): void => setOpen(openChange)}>
            <DialogTrigger asChild={true}>
                <Button variant="outline" onClick={(): void => setOpen(true)} className={className}>
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
                        onClick={(symbol): void => {
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
                    <div className="flex flex-row items-center gap-2">
                        <Checkbox
                            disabled={!tempSelectedSymbol}
                            name="actualPrice"
                            onCheckedChange={(checked): void => {
                                if (refBuyPrice.current) {
                                    refBuyPrice.current.disabled = Boolean(checked)
                                }

                                if (tempSelectedSymbol && refBuyPrice.current && Boolean(checked)) {
                                    price.mutate(undefined, {
                                        onSuccess: (data): void => {
                                            if (refBuyPrice.current) {
                                                refBuyPrice.current.value = data?.info?.close || "0"
                                            }
                                        }
                                    })

                                    // refBuyPrice.current.value = price?.data?.info?.close || "0"
                                } else if (tempSelectedSymbol && !checked && refBuyPrice.current) {
                                    refBuyPrice.current.disabled = Boolean(checked);
                                    refBuyPrice.current.value = "0"
                                }
                            }}

                        />
                        <Label htmlFor="actualPrice">Prix actuel</Label>
                    </div>

                    <Label htmlFor="buyAt">Date d'achat</Label>
                    <Popover>
                        <PopoverTrigger asChild={true}>
                            <Button
                                variant="outline"
                                className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 size-4" />
                                {date ? format(date, "PPP") : <span>Date d'achat</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                locale={fr}
                                selected={date}
                                onSelect={setDate}
                                disabled={(dateValue): boolean => {
                                    return dateValue > new Date() || dateValue < new Date("1970-01-01")
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    <DialogFooter className="flex flex-row justify-center gap-2">
                        <Button variant="destructive" type="reset" className="w-full" onClick={(): void => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="default" type="submit" className="w-full" onClick={handleSave}>
                            Ajouter
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
