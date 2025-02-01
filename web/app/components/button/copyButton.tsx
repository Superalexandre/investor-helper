import React from "react"
import { Button } from "../ui/button"
import { useCopyToClipboard } from "usehooks-ts"
import { toast as sonner } from "sonner"
import { cn } from "../../lib/utils"
import { useTranslation } from "react-i18next"
import { CopyIcon } from "lucide-react"

// Ajout de React.forwardRef pour que CopyButton accepte une ref
const CopyButton = React.forwardRef<HTMLButtonElement, { content: string; className?: string, label?: boolean }>(
	({ content, className, label = true }, ref) => {
		const { t } = useTranslation("common", {
			useSuspense: false,
		})
		const [, copy] = useCopyToClipboard()

		const copyCallback = () => {
			copy(content)
				.then((result) => {
					if (result) {
						sonner.success(t("copyLink.success"), {
							duration: 1500,
						})
					} else {
						sonner.error(t("copyLink.error"), {
							duration: 1500,
						})
					}
				})
				.catch((err) => {
					console.error("Error copying", err)
				})
		}

		return (
			<Button
				ref={ref} // On passe la ref ici
				variant="ghost"
				onClick={(event) => {
					copyCallback()

					event.currentTarget.blur()
				}}
				className={cn("flex w-full flex-row items-center justify-start gap-1.5", className)}
			>
				{label ? t("copyLink.trigger") : null}

				<CopyIcon className="size-5" />
			</Button>
		)
	}
)

CopyButton.displayName = "CopyButton" // Nécessaire pour React DevTools et éviter des erreurs

export default CopyButton
