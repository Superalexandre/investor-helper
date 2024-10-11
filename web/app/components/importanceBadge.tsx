import { MdStar } from "react-icons/md"
import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"

interface ImportanceBadgeProps {
	importance: number
	className?: string
}

export default function ImportanceBadge({ importance, className }: ImportanceBadgeProps) {
	const getColor = (score: number) => {
		if (score > 200) {
			return "bg-pink-700"
		}
		if (score > 150) {
			return "bg-red-500"
		}
		if (score > 100) {
			return "bg-orange-500"
		}
		if (score > 50) {
			return "bg-yellow-500"
		}
	}

	return (
		<Badge className={cn("flex flex-row items-center justify-center", className, getColor(importance))}>
			{importance > 50 ? <MdStar className="size-5 text-white" /> : null}
			{importance > 100 ? <MdStar className="size-5 text-white" /> : null}
			{importance > 150 ? <MdStar className="size-5 text-white" /> : null}
			{importance > 200 ? <MdStar className="size-5 text-white" /> : null}
		</Badge>
	)
}
