import React from "react"
import { Button } from "../ui/button"
import { useCopyToClipboard } from "usehooks-ts"
import { toast as sonner } from "sonner"
import { cn } from "../../lib/utils"
import { useTranslation } from "react-i18next"
import { CopyIcon } from "lucide-react"

const CopyButton = React.forwardRef<HTMLButtonElement, { content: string; className?: string, label?: boolean, labelContent?: string, copyError?: string, copySuccess?: string }>(
	({ content, copyError, copySuccess, className, label = true, labelContent }, ref) => {
		const { t } = useTranslation("common", {
			useSuspense: false,
		})
		const [, copy] = useCopyToClipboard()

		const copyCallback = (): void => {
			copy(content)
				.then((result) => {
					if (result) {
						sonner.success(copySuccess ? copySuccess : t("copyLink.success"), {
							duration: 1500,
						})
					} else {
						sonner.error(copyError ? copyError : t("copyLink.error"), {
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
				onClick={(event): void => {
					copyCallback()

					event.currentTarget.blur()
				}}
				className={cn("flex w-full flex-row items-center justify-start gap-2", className)}
			>
				{label || labelContent ? labelContent ?? t("copyLink.trigger") : null}

				<CopyIcon className="size-5" />
			</Button>
		)
	}
)

CopyButton.displayName = "CopyButton" // Nécessaire pour React DevTools et éviter des erreurs

export default CopyButton
