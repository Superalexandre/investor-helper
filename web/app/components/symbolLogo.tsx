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

    console.log(symbol)

    const source = symbol["logoid"] || symbol["base_currency_logoid"] 
 
    if (!source) return fallback || null

    console.log(source)

    return (
        <img
            src={`https://s3-symbol-logo.tradingview.com/${source}.svg`}
            alt={alt || "Icon"}
            className={className}
        />
    )
}