import { Button } from "../ui/button"
import { useCopyToClipboard } from "usehooks-ts"
import { toast as sonner } from "sonner"
import { cn } from "../../lib/utils"
import { useTranslation } from "react-i18next"
import { CopyIcon } from "lucide-react"

export default function CopyButton({
	content,
	className
}: {
	content: string
	className?: string
}) {
	const { t } = useTranslation("common", {
		useSuspense: false
	})
	const [, copy] = useCopyToClipboard()

	const copyCallback = () => {
		copy(content)
			.then((result) => {
				if (result) {
					sonner.success(t("copyLink.success"), {
						duration: 1500
					})
				} else {
					sonner.error(t("copyLink.error"), {
						duration: 1500
					})
				}
			})
			.catch((err) => {
				console.error("Error copying", err)
			})
	}

	return (
		<Button
			variant="ghost"
			onClick={(event) => {
				copyCallback()

				event.currentTarget.blur()
			}}
			className={cn("flex w-full flex-row items-center justify-start gap-1.5", className)}
		>
			{t("copyLink.trigger")}

			<CopyIcon className="size-5" />
		</Button>
	)
}
