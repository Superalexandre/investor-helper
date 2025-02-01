import React from "react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { useTranslation } from "react-i18next"
import { Share2Icon } from "lucide-react"

const ShareButton = React.forwardRef<HTMLButtonElement, { title: string; text: string; url: string; className?: string }>(
	({ title, text, url, className }, ref) => {
		const { t } = useTranslation("common", {
			useSuspense: false,
		})

		const shareCallback = async () => {
			if (navigator) {
				const shareData = {
					title: title,
					text: text,
					url: url,
				}

				try {
					await navigator.share(shareData)
				} catch (err) {
					console.error("Error sharing", err)
				}
			}
		}

		return (
			<Button
				ref={ref} // On passe la ref ici
				variant="ghost"
				onClick={(event) => {
					shareCallback()
					event.currentTarget.blur()
				}}
				className={cn("flex w-full flex-row items-center justify-start gap-1.5", className)}
			>
				{t("shareLink.trigger")}
				<Share2Icon className="size-5" />
			</Button>
		)
	}
)

// Ajout du displayName pour faciliter le débogage
ShareButton.displayName = "ShareButton"

export default ShareButton