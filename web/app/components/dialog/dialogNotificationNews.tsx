import { MdAdd, MdDelete } from "react-icons/md"
import { Badge } from "../ui/badge"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { type FormEvent, type ReactNode, useRef, useState } from "react"
import { usePush } from "@remix-pwa/push/client"
import { useSubmit, useFetcher } from "@remix-run/react"
import { toast as sonner } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export default function DialogNotificationNews({
	open,
	setOpen,
	type,
	keywords,
	groupName,
	id
}: {
	open: boolean
	setOpen: (open: boolean) => void
	type: "create" | "update"
	keywords?: string[]
	groupName?: string
	id?: string
}): ReactNode {
	const { pushSubscription } = usePush()
    const queryClient = useQueryClient()

	const submit = useSubmit()
	const fetcher = useFetcher()
	const [keyword, setKeyword] = useState<string[]>(keywords ?? [])
	const keywordInput = useRef<HTMLInputElement>(null)

	const action = type === "create" ? "/api/notifications/subscribe/news" : `/api/notifications/update/news/${id}`

	const addKeyword = (): void => {
		if (!keywordInput.current?.value) {
			return
		}

		const word = keywordInput.current.value.toLowerCase()

		if (keyword.includes(word) || word === "" || word === " " || word === ",") {
			return
		}

		setKeyword([...keyword, word])

		if (keywordInput.current) {
			keywordInput.current.value = ""
		}
	}

	const submitCallback = (e: FormEvent<HTMLFormElement>): void => {
		e.preventDefault()

		const formData = new FormData(e.currentTarget)
		if (pushSubscription) {
			formData.append("pushSubscription", JSON.stringify(pushSubscription))
		}

		if (keyword.length > 0) {
			formData.append("keywords", keyword.join(","))
		}

		submit(formData, {
			encType: "multipart/form-data",
			method: "post",
			action: action,
			navigate: false
		})

		setOpen(false)
		setKeyword(keyword ?? keywords ?? [])

		sonner("Notification crée", {
			description: "La notification a été crée avec succès",
			closeButton: true,
			id: id,
			className: "flex justify-between"
		})

		queryClient.invalidateQueries({
			queryKey: ["notificationsInfo"]
		})
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(openChange): void => {
				setOpen(openChange)
				setKeyword(keywords ?? [])
			}}
		>
			<DialogContent className="w-11/12">
				<fetcher.Form method="post" action={action} onSubmit={submitCallback}>
					<DialogHeader>
						{type === "create" ? (
							<>
								<DialogTitle>Nouvelle notification</DialogTitle>
								<DialogDescription>Ajouter une notification pour une actualité</DialogDescription>
							</>
						) : (
							<>
								<DialogTitle>Modifier la notification</DialogTitle>
								<DialogDescription>Modifier une notification pour une actualité</DialogDescription>
							</>
						)}
					</DialogHeader>

					<div className="my-4 flex flex-col justify-start gap-4">
						<Input
							type="text"
							name="name"
							placeholder="Nom du groupe de notifications"
							className="w-full"
							required={true}
							defaultValue={groupName}
						/>

						<div className="flex flex-col gap-2">
							<div className="flex flex-row flex-wrap items-center gap-2">
								{keyword.map((word, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<Badge key={index} className="flex flex-row items-center gap-2">
										{word}

										<MdDelete
											size={16}
											className="hover:cursor-pointer"
											onClick={(): void => setKeyword(keyword.filter((_, i) => i !== index))}
										/>
									</Badge>
								))}
							</div>

							<div className="flex w-full flex-row gap-2">
								<Input
									type="text"
									placeholder="Mots clés"
									className="w-full"
									ref={keywordInput}
									onKeyDown={(e): void => {
										if (e.key === "Enter") {
											e.preventDefault()

											addKeyword()
										}
									}}
								/>

								<Button variant="outline" onClick={addKeyword} type="button">
									<MdAdd />
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter className="mt-3 flex flex-row gap-3 lg:gap-0">
						<DialogClose asChild={true}>
							<Button
								variant="destructive"
								type="reset"
								onClick={(): void => setKeyword(keywords ?? [])}
							>
								Fermer
							</Button>
						</DialogClose>
						<Button variant="default" type="submit">
							{type === "create" ? "Créer" : "Modifier"}
						</Button>
					</DialogFooter>
				</fetcher.Form>
			</DialogContent>
		</Dialog>
	)
}