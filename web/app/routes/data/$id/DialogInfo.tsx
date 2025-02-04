import type { Dispatch, ReactNode, SetStateAction } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import CopyButton from "../../../components/button/copyButton"

export function DialogInfo({
    open,
    setOpen,
    description,
    currency,
    prettyCurrency,
    country,
    countryCode,
    isin,
    exchange,
    name,
    sector
}: {
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>,
    description: string,
    currency?: string,
    prettyCurrency: string,
    country?: string,
    countryCode: string,
    isin?: string,
    exchange: string,
    name: string,
    sector?: string
}): ReactNode {
    const copyConfig = {
        label: false,
        copySuccess: "Copié !",
        copyError: "Erreur lors de la copie",
        className: "w-auto"
    }

    return (
        <Dialog open={open} onOpenChange={(newOpen): void => setOpen(newOpen)}>
            <DialogContent className="max-h-full w-11/12 max-w-fit overflow-auto">
                <DialogHeader>
                    <DialogTitle className="w-11/12 truncate">Info sur {description}</DialogTitle>
                    <DialogDescription>
                        Informations sur le symbol
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {currency ? (
                        <div className="flex flex-row items-center gap-2">
                            <p>Monnaie : {currency} {prettyCurrency}</p>

                            <CopyButton content={currency} {...copyConfig} />
                        </div>
                    ) : null}

                    {country ? (
                        <div className="flex flex-row items-center gap-2">
                            <p>Pays : {country} {countryCode}</p>

                            <CopyButton content={country} {...copyConfig} />
                        </div>
                    ) : null}

                    {isin ? (
                        <div className="flex flex-row items-center gap-2">
                            <p>ISIN : {isin}</p>

                            <CopyButton content={isin} {...copyConfig} />
                        </div>
                    ) : null}

                    <div className="flex flex-row items-center gap-2">
                        <p>Exchange : {exchange}</p>

                        <CopyButton content={exchange} {...copyConfig} />
                    </div>

                    <div className="flex flex-row items-center gap-2">
                        <p>Nom : {name} </p>

                        <CopyButton content={name} {...copyConfig} />
                    </div>

                    {sector ? (
                        <div className="flex flex-row items-center gap-2">
                            <p>Secteur : {sector}</p>

                            <CopyButton content={sector} {...copyConfig} />
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}