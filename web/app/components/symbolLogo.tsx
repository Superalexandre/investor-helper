import type { ReactNode } from "react"
import {
	Avatar as ImageContainer,
	AvatarFallback as ImageFallback,
	AvatarImage as ImageContent
} from "@/components/ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { cn } from "../lib/utils"

export default function SymbolLogo({
	symbol,
	className,
	alt,
	fallback,
	width,
	height,
	format
}: {
	symbol:
		| {
				// biome-ignore lint/suspicious/noExplicitAny: This is a valid type.
				[key: string]: any
		  }
		| undefined | string
	className?: string
	alt?: string
	// React.ReactNode
	fallback?: ReactNode,
	width?: number,
	height?: number,
	format?: string
}) {
	if (!symbol) {
		return fallback || null
	}

	const source = typeof symbol === "string" ? symbol : symbol.logoid || symbol.base_currency_logoid

	if (!source) {
		return fallback || null
	}

	// const url = new URL(`/api/image/symbol?name=${source}`)
	let url = `/api/image/symbol?name=${source}`

	if (width) {
		url += `&width=${width}`
	}

	if (height) {
		url += `&height=${height}`
	}

	if (format) {
		url += `&format=${format}`
	}

	return (
		<ImageContainer className={cn(className)}>
			<ImageContent src={url.toString()} alt={alt || "Icon"} className="bg-transparent" />
			<ImageFallback className="bg-transparent">
				<Skeleton className="size-full rounded-full bg-muted" />
			</ImageFallback>
		</ImageContainer>
	)
}
