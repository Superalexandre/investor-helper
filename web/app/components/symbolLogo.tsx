import type { ReactNode } from "react"

export default function SymbolLogo({
	symbol,
	className,
	alt,
	fallback
}: {
	symbol:
		| {
				// biome-ignore lint/suspicious/noExplicitAny: This is a valid type.
				[key: string]: any
		  }
		| undefined
	className?: string
	alt?: string
	// React.ReactNode
	fallback?: ReactNode
}) {
	if (!symbol) {
		return fallback || null
	}

	const source = symbol.logoid || symbol.base_currency_logoid

	if (!source) {
		return fallback || null
	}

	return <img src={`/api/image/symbol?name=${source}`} alt={alt || "Icon"} className={className} />
}
