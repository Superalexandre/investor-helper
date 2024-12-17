import { Button } from "./ui/button"
import { useState, memo } from "react"
import { cn } from "@/lib/utils"
import { useEventListener } from "usehooks-ts"
import { ArrowUpIcon } from "lucide-react"

interface ScrollTopProps {
	showBelow: number
}

export const ScrollTop = memo(function ScrollTop({ showBelow = 250 }: ScrollTopProps) {
	const [visible, setVisible] = useState(false)

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		})
	}

	const toggleVisibility = () => {
		if (window.scrollY > showBelow) {
			setVisible(true)
		} else {
			setVisible(false)
		}
	}

	useEventListener("scroll", toggleVisibility)

	return (
		<Button
			variant="default"
			className={cn(visible ? "block" : "hidden", "fixed right-4 bottom-4 z-10 size-12")}
			onClick={scrollToTop}
		>
			<ArrowUpIcon className="size-full" />
		</Button>
	)
})
