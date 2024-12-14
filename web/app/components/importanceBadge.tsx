import { MdStar } from "react-icons/md"
import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"

interface ImportanceBadgeProps {
	starNumber: number
	className?: string
}

export default function ImportanceBadge({ starNumber, className }: ImportanceBadgeProps) {
	return (
		<Badge className={cn("flex flex-row items-center justify-center bg-foreground text-background", className)}>
			{starNumber >= 1 ? <MdStar className="size-5"  /> : null}
			{starNumber >= 2 ? <MdStar className="size-5" /> : null}
			{starNumber >= 3 ? <MdStar className="size-5" /> : null}
			{starNumber >= 4 ? <MdStar className="size-5" /> : null}
		</Badge>
	)
}
