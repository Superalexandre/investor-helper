import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import type { ReactNode } from "react"
import { Button } from "../../../components/ui/button"
import { DialogAddSymbols } from "./DialogAddSymbols"

const columnHelper = createColumnHelper<{
    logoid: string
    description: string,
    symbol: string,
    quantity: number,
    totalValue: number
    performance: number
    performancePercentage: number
}>()

const columns = [
    columnHelper.accessor("logoid", {
        header: undefined,
        cell: ({ row }): ReactNode => {
            return (
                <img src={`/api/image/symbol?name=${row.original.logoid}`} alt={row.original.symbol} className="h-8 w-8 rounded-full" />
            )
        }
    }),
    columnHelper.accessor("description", {
        header: "Nom",
        cell: ({ getValue }): string => getValue()
    }),
    columnHelper.accessor("symbol", {
        header: "Symbole",
        cell: ({ getValue }): string => getValue()
    }),
    columnHelper.accessor("quantity", {
        header: "Quantité",
        cell: ({ getValue }): string => getValue().toFixed(2)
    }),
    columnHelper.accessor("totalValue", {
        id: "totalValue",
        header: "Valeur totale",
        cell: ({ getValue }): string => getValue().toFixed(2),
    }),
    columnHelper.accessor("performance", {
        header: "Performance",
        cell: ({ getValue }): string => getValue().toFixed(2)
    }),
]

export function TableData({
    walletId,
    prices
}: {
    walletId: string,
    prices: {
        logoid: string,
        description: string,
        totalValue: number
        symbol: string,
        quantity: number,
        performance: number,
        performancePercentage: number
    }[]
}): ReactNode {

    const table = useReactTable({
        columns: columns,
        data: prices,
        getCoreRowModel: getCoreRowModel()
    })

    return (
        <div className="w-full">
            <table className="w-full">
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    {table.getFooterGroups().map(footerGroup => (
                        <tr key={footerGroup.id}>
                            {footerGroup.headers.map(header => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.footer,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </tfoot>
            </table>

            <div className="flex w-full">
                <DialogAddSymbols 
                    walletId={walletId}
                    triggerText="Ajouter une action"
                />
                {/* <Button 
                    variant="default" 
                    className="mt-4 ml-auto"
                >
                    Ajouter une action
                </Button> */}
            </div>
        </div>
    )
}