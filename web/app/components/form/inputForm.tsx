import type { ForwardRefExoticComponent, HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute, RefAttributes } from "react"
import type { IconType } from "react-icons/lib"
import type { JSX } from "react"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"
import type { LucideProps } from "lucide-react"

interface FieldErrors {
	[key: string]: {
		message: string
	}
}

interface InputFormProps {
	parentClass?: string
	errorClass?: string
	type: HTMLInputTypeAttribute
	placeholder?: string | undefined
	autoComplete?: HTMLInputAutoCompleteAttribute | undefined
	className?: string | undefined
	id?: string | undefined
	name?: string | undefined
	// biome-ignore lint/style/useNamingConvention: <explanation>
	Icon?: IconType | ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
	errors?: FieldErrors
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	register?: any
	// biome-ignore lint/style/useNamingConvention: <explanation>
	ShowButton?: JSX.Element
}

export default function InputForm({
	parentClass,
	errorClass,
	type = "text",
	placeholder,
	autoComplete,
	className,
	id,
	name,
	Icon,
	errors,
	register,
	ShowButton
}: InputFormProps) {
	return (
		<div className={cn("flex w-full flex-col items-start justify-center", parentClass)}>
			<label htmlFor={name} className="flex flex-row items-center justify-center gap-2 dark:text-white">
				{Icon ? <Icon size={20} /> : null}

				{placeholder}
			</label>

			<div className="relative w-full">
				<Input
					type={type}
					placeholder={placeholder}
					autoComplete={autoComplete}
					className={className}
					id={id}
					name={name}
					{...register(name)}
				/>

				{ShowButton}
			</div>

			{errors && name && errors[name] ? (
				<span className={cn("w-full text-center text-red-500 lg:text-left", errorClass)}>
					{errors[name]?.message?.toString()}
				</span>
			) : null}
		</div>
	)
}

export type { FieldErrors, InputFormProps }
