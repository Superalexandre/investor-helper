import { Link, useLocation } from "@remix-run/react"
import { Button } from "./ui/button"
import { MdArrowBack } from "react-icons/md"

export default function BackButton() {
	const location = useLocation()

	return (
		<div className="w-full">
			<Button asChild={true} variant="default">
				<Link
					to={{
						// pathname: "/news",
						pathname: location.state?.redirect ?? "/",
						hash: location.state?.hash ?? undefined,
						search: location.state?.search ?? undefined
					}}
					className="top-0 left-0 m-4 flex flex-row items-center justify-center gap-1.5 text-center lg:absolute"
				>
					<MdArrowBack className="size-6" />
					Retour
				</Link>
			</Button>
		</div>
	)
}
