import { type Path, useNavigate } from "@remix-run/react"
import { Button } from "../ui/button"
import { MdArrowBack } from "react-icons/md"
import { useEffect, useState } from "react"

type To = string | Partial<Path>

export default function BackButton({
	forceRedirect,
	fallbackRedirect,
	label = "Retour"
}: {
	forceRedirect?: string
	fallbackRedirect?: string
	label?: string
}) {
	const navigate = useNavigate()
	const [goTo, setGoTo] = useState<string | number>(-1)

	useEffect(() => {
		if (window.history.length <= 1 || !window.history.state?.idx) {
			setGoTo(fallbackRedirect || "/")
		}
	}, [fallbackRedirect])

	console.log("goTo", goTo)

	return (
		<div className="w-full">
			<Button
				variant="default"
				className="top-0 left-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
				onClick={() => {
					if (forceRedirect) {
						return navigate(forceRedirect)
					}

					navigate(goTo as To)
				}}
			>
				<MdArrowBack className="size-6" />

				{label}
			</Button>
		</div>
	)
}
