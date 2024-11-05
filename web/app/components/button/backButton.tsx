import { useNavigate } from "@remix-run/react"
import { Button } from "../ui/button"
import { MdArrowBack } from "react-icons/md"

export default function BackButton({
	forceRedirect,
	label = "Retour"
}: {
	forceRedirect?: string
	label?: string
}) {
	const navigate = useNavigate()

	return (
		<div className="w-full">
			<Button
				variant="default"
				className="top-0 left-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
				onClick={() => {
					if (forceRedirect) {
						return navigate(forceRedirect)
					}

					navigate(-1)
				}}
			>
				<MdArrowBack className="size-6" />

				{label}
			</Button>
		</div>
	)
}
