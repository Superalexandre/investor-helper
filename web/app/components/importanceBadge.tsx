import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"
import { StarIcon } from "lucide-react"

interface ImportanceBadgeProps {
	starNumber: number
	className?: string
}

export default function ImportanceBadge({ starNumber, className }: ImportanceBadgeProps) {
	return (
		<Badge className={cn("flex flex-row items-center justify-center bg-foreground fill-background", className)}>
			{starNumber >= 1 ? <StarIcon className="size-5 fill-background"  /> : null}
			{starNumber >= 2 ? <StarIcon className="size-5 fill-background" /> : null}
			{starNumber >= 3 ? <StarIcon className="size-5 fill-background" /> : null}
			{starNumber >= 4 ? <StarIcon className="size-5 fill-background" /> : null}
		</Badge>
	)
}
