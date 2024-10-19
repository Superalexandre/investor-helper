import { Link, useLocation } from "@remix-run/react"
import { Button } from "./ui/button"
import { MdArrowBack } from "react-icons/md"

export default function BackButton({
	safeRedirect = "/",
	safeHash = "",
	safeSearch = "",
	label = "Retour"
}: {
	safeRedirect?: string,
	safeHash?: string,
	safeSearch?: string,
	label?: string
}) {
	const location = useLocation()

	return (
		<div className="w-full">
			<Button asChild={true} variant="default">
				<Link
					to={{
						pathname: location.state?.redirect ?? safeRedirect,
						hash: location.state?.hash ?? safeHash,
						search: location.state?.search ?? safeSearch
					}}
					className="top-0 left-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
				>
					<MdArrowBack className="size-6" />
					
					{label}
				</Link>
			</Button>
		</div>
	)
}
