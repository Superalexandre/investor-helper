import { MdArrowUpward } from "react-icons/md"
import { Button } from "./ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useEventListener } from "usehooks-ts"

interface ScrollTopProps {
    showBelow: number
}

export function ScrollTop({
    showBelow = 250
}: ScrollTopProps) {
    const [visible, setVisible] = useState(false)

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth", 
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
            className={cn(visible ? "block" : "hidden", "fixed bottom-4 right-4 z-10 size-12")}
            onClick={scrollToTop}
        >
            <MdArrowUpward className="size-full" />
        </Button>
    )


}