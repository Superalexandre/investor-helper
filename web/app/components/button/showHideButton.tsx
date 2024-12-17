import { Button } from "../ui/button"
import { EyeIcon, EyeOffIcon } from "lucide-react";

export function ShowButtonComponent({ show, setShow }: { show: boolean; setShow: (show: boolean) => void }) {
	return (
		<Button
			variant="ghost"
			type="button"
			onClick={() => setShow(!show)}
			className="absolute inset-y-0 right-0"
			aria-label="Afficher le mot de passe"
		>
			<EyeIcon className={`${show ? "hidden" : "block"} size-5`} />
			<EyeOffIcon className={`${show ? "block" : "hidden"} size-5`} />
		</Button>
	)
}
