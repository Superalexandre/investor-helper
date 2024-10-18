import { cn } from "../lib/utils"

export default function Loading({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				// biome-ignore lint/nursery/noSecrets: Class names are not secrets
				"inline-block animate-spin rounded-full border-4 border-current border-r-transparent border-solid align-[-0.125em] text-white motion-reduce:animate-[spin_1.5s_linear_infinite]",
				className
			)}
		/>
	)
}
