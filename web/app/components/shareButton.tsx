import { MdShare } from "react-icons/md"
import { Button } from "./ui/button"

export default function ShareButton({
	title,
	text,
	url
}: {
	title: string
	text: string
	url: string
}) {
	const shareCallback = async () => {
		if (navigator) {
			const shareData = {
				title: title,
				text: text,
				url: url
			}

			// Check if the device is phone or computer

			try {
				await navigator.share(shareData)
			} catch (err) {
				console.error("Error sharing", err)
			}
		}
	}

	return (
		<Button
			variant="ghost"
			onClick={shareCallback}
			className="flex w-full flex-row items-center justify-start gap-1.5"
		>
			Partager
			<MdShare className="size-5" />
		</Button>
	)
}
