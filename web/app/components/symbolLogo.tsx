import type { ReactNode } from "react"
import { Avatar as ImageContainer, AvatarFallback as ImageFallback, AvatarImage as ImageContent } from "@/components/ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { cn } from "../lib/utils"
import Loading from "./loading"

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

	return (
		<ImageContainer className={cn(className)}>
			<ImageContent src={`/api/image/symbol?name=${source}`} alt={alt || "Icon"} className="bg-transparent" />
			<ImageFallback className="bg-transparent">
				<Skeleton className="size-full rounded-full bg-muted" />
			</ImageFallback>
		</ImageContainer>

	)
}
