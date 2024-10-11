import type { HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute } from "react"
import type { IconType } from "react-icons/lib"
import type {  JSX } from "react"
import { Input } from "../ui/input"

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
	Icon?: IconType
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
		<div className={`flex w-11/12 flex-col items-start justify-center lg:w-1/2 ${parentClass}`}>
			<label htmlFor={name} className="flex flex-row items-center justify-center gap-2 text-white">
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
				<span className={`w-full text-center text-red-500 lg:text-left ${errorClass}`}>
					{errors[name]?.message?.toString()}
				</span>
			) : null}
		</div>
	)
}

export type {
	FieldErrors,
	InputFormProps
}