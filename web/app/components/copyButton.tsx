import { MdContentCopy } from "react-icons/md"
import { Button } from "./ui/button"
import { useCopyToClipboard } from "usehooks-ts"
import { toast as sonner } from "sonner"

export default function CopyButton({
	content
}: {
    content: string
}) {
    const [, copy] = useCopyToClipboard()

	const copyCallback = () => {
        copy(content)
            .then(() => {
                sonner.success("Copié dans le presse-papier", {
                    duration: 1500
                })
            })
            .catch((err) => {
                console.error("Error copying", err)

                sonner.error("Erreur lors de la copie", {
                    duration: 1500
                })
            })
    }

	return (
		<Button
			variant="ghost"
			onClick={copyCallback}
			className="flex w-full flex-row items-center justify-start gap-1.5"
		>
			Copier le lien

			<MdContentCopy className="size-5" />
		</Button>
	)
}
