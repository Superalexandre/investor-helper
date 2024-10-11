import { MdVisibility, MdVisibilityOff } from "react-icons/md";

export function ShowButtonComponent({ show, setShow }: { show: boolean; setShow: (show: boolean) => void }) {
	return (
		<button
			type="button"
			onClick={() => setShow(!show)}
			className="absolute inset-y-0 right-0 mr-3 text-white hover:text-slate-400"
			aria-label="Afficher le mot de passe"
		>
			<MdVisibility size={20} className={`${show ? "hidden" : "block"}`} />
			<MdVisibilityOff size={20} className={`${show ? "block" : "hidden"}`} />
		</button>
	)
}
