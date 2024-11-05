import { MdVisibility, MdVisibilityOff } from "react-icons/md"
import { Button } from "../ui/button"

export function ShowButtonComponent({ show, setShow }: { show: boolean; setShow: (show: boolean) => void }) {
	return (
		<Button
			variant="ghost"
			type="button"
			onClick={() => setShow(!show)}
			className="absolute inset-y-0 right-0"
			aria-label="Afficher le mot de passe"
		>
			<MdVisibility size={20} className={`${show ? "hidden" : "block"}`} />
			<MdVisibilityOff size={20} className={`${show ? "block" : "hidden"}`} />
		</Button>
	)
}
