import { type ReactNode, useRef, useState } from "react"
import type { NotificationSubscribedFullNews } from "../../../../../types/Notifications"
import { Input } from "../../../../components/ui/input"
import { Button } from "../../../../components/ui/button"
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import { Switch } from "../../../../components/ui/switch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast as sonner } from "sonner"

export function NewsNotifications({
    news
}: {
    news: NotificationSubscribedFullNews[]
}): ReactNode {
    return (
        <div className="flex flex-col gap-4">
            {news.length > 0 ? (
                news.map((notification) => <DisplayNewsNotification key={notification.notificationId} notification={notification} />)
            ) : (
                <p>Vous n'avez pas de notification pour les actualités</p>
            )}
        </div>
    )
}

export function DisplayNewsNotification({
    notification
}: {
    notification: NotificationSubscribedFullNews
}): ReactNode {
    const queryClient = useQueryClient()

    const [openKeyword, setOpenKeyword] = useState(false)

    const [editTitle, setEditTitle] = useState(false)
    const [title, setTitle] = useState(notification.name)

    const keywordInput = useRef<HTMLInputElement>(null)
    const [keywords, setKeywords] = useState(notification.keywords.map((keyword) => keyword.keyword))

    const [active, setActive] = useState(notification.active)

    const updateTitle = useMutation({
        mutationFn: async (): Promise<string> => {
            const res = await fetch("/api/notifications/update/news/title", {
                method: "POST",
                body: JSON.stringify({
                    id: notification.notificationId,
                    title
                })
            });

            return await res.json();
        },
        onSuccess: (): void => {
            queryClient.invalidateQueries({
                queryKey: ["notificationsInfo"]
            }).then(() => {
                sonner("Titre du groupe mis a jour", {
                    description: "Le titre du groupe a été mis à jour avec succès",
                    closeButton: true
                })
            })
        }
    })

    const updateKeywords = useMutation({
        mutationFn: async (): Promise<string> => {
            const res = await fetch("/api/notifications/update/news/keywords", {
                method: "POST",
                body: JSON.stringify({
                    id: notification.notificationId,
                    keywords
                })
            });

            return await res.json();
        },
        onSuccess: (): void => {
            queryClient.invalidateQueries({
                queryKey: ["notificationsInfo"]
            }).then(() => {
                sonner("Mots-clés mis a jour", {
                    description: "Les mots-clés ont été mis à jour avec succès",
                    closeButton: true
                })
            })
        }
    })

    const handleNewKeyword = (close = true): void => {
        if (close) {
            setOpenKeyword(!openKeyword)
        }

        const keyword = keywordInput.current?.value.toLowerCase().trim()
        if (keyword) {
            setKeywords([...keywords, keyword])
            updateKeywords.mutate()
        }

        if (keywordInput.current) {
            keywordInput.current.value = ""
        }
    }

    const updateActive = useMutation({
        mutationFn: async (): Promise<string> => {
            const res = await fetch("/api/notifications/update/news/active", {
                method: "POST",
                body: JSON.stringify({
                    id: notification.notificationId,
                    active: active
                })
            });

            return await res.json();
        },
        onSuccess: (): void => {
            queryClient.invalidateQueries({
                queryKey: ["notificationsInfo"]
            }).then(() => {
                sonner("Notifications mis a jour", {
                    description: "Les notifications ont été mis à jour avec succès",
                    closeButton: true
                })
            })
        }
    })

    const deleteNotifications = useMutation({
        mutationFn: async (): Promise<string> => {
            const res = await fetch(`/api/notifications/unsubscribe/news/${notification.notificationId}`, {
                method: "POST"
            });

            return await res.json();
        },
        onSuccess: (): void => {
            queryClient.invalidateQueries({
                queryKey: ["notificationsInfo"]
            }).then(() => {
                sonner("Groupe supprimé", {
                    description: "Le groupe de notifications a été supprimé avec succès",
                    closeButton: true
                })
            })
        }
    })

    return (
        <div
            key={notification.notificationId}
            className="flex flex-col gap-2"
        >
            <div className="flex max-w-full flex-row items-center justify-between gap-4">
                {editTitle ? (
                    <div className="flex flex-row items-center gap-2">
                        <Input
                            placeholder="Titre de la notification"
                            defaultValue={notification.name}
                            onChange={(e): void => setTitle(e.target.value)}
                            onKeyDown={(e): void => {
                                if (e.key === "Enter") {
                                    setEditTitle(!editTitle)

                                    if (title !== notification.name) {
                                        updateTitle.mutate()
                                    }
                                }
                            }}
                        />

                        <Button
                            disabled={updateTitle.isPending}
                            variant="ghost"
                            onClick={(): void => {
                                setEditTitle(!editTitle)

                                if (title !== notification.name) {
                                    updateTitle.mutate()
                                }
                            }}
                        >
                            <CheckIcon className="size-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex w-3/4 flex-row items-center gap-4">
                        <h1 className="truncate font-bold text-lg">{title}</h1>

                        <Button
                            disabled={updateTitle.isPending}
                            variant="ghost"
                            onClick={(): void => setEditTitle(!editTitle)}
                        >
                            <PencilIcon className="size-4" />
                        </Button>
                    </div>
                )}

                <div className="flex flex-row items-center gap-2">
                    <Switch 
                        disabled={updateActive.isPending}
                        checked={active}
                        onCheckedChange={(): void => {
                            setActive(!active)
                            updateActive.mutate()
                        }}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteNotifications.isPending}
                        onClick={(): void => {
                            deleteNotifications.mutate()
                        }}
                    >
                        <Trash2Icon className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-row flex-wrap gap-2">
                {keywords.map((keyword) => (
                    <span
                        key={keyword}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs"
                    >
                        {keyword}
                        <button
                            type="button"
                            onClick={(): void => {
                                setKeywords(keywords.filter((kw) => kw !== keyword))
                                updateKeywords.mutate()
                            }}
                            className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/20 hover:text-primary-foreground focus:outline-none"
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    </span>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                {openKeyword ? (
                    <div className="flex flex-row gap-2">
                        <Input
                            placeholder="Mot-clé"
                            ref={keywordInput}
                            onKeyDown={(e): void => {
                                if (e.key === "Enter") {
                                    handleNewKeyword(false)
                                }
                            }}
                        />

                        <Button
                            variant="default"
                            onClick={(): void => handleNewKeyword()}
                        >
                            <PlusIcon className="size-4" />
                        </Button>
                    </div>
                ) : null}

                <Button variant="outline" className="flex w-min flex-row gap-2" onClick={(): void => setOpenKeyword(!openKeyword)}>
                    {openKeyword ? (
                        <>
                            <span>Terminer</span>

                            <CheckIcon className="size-4" />
                        </>
                    ) : (
                        <>
                            <span>Ajouter un mot-clé</span>

                            <PlusIcon className="size-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}