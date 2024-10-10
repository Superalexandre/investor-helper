import { ReactNode } from "react"

export default function SymbolLogo({
    symbol,
    className,
    alt,
    fallback
}: {
    symbol: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any
    } | undefined,
    className?: string
    alt?: string,
    // React.ReactNode
    fallback?: ReactNode
}) {
    if (!symbol) return fallback || null

    const source = symbol["logoid"] || symbol["base_currency_logoid"] 
 
    if (!source) return fallback || null

    return (
        <img
            src={`/api/image/symbol?name=${source}`}
            alt={alt || "Icon"}
            className={className}
        />
    )
}