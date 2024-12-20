import { type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { getNotificationList } from "../../../../utils/notifications"
import { getUser } from "../../../session.server"
import { Link, useLoaderData } from "@remix-run/react"
import { memo } from "react"
import type { NotificationList } from "../../../../../db/schema/notifications"
import { Card, CardContent, CardFooter, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { CheckCheckIcon, Trash2Icon } from "lucide-react"

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request)

    if (!user) {
        return redirect("/login?redirect=/profile")
    }

    const notificationList = await getNotificationList(user.id)
    return {
        user,
        notificationList
    }
}

export function meta() {
    return [
        { title: "Investor Helper - Vos notifications" },
        { name: "description", content: "Regardez vos notifications" }
    ]
}


export default function Index() {
    const { notificationList } = useLoaderData<typeof loader>()

    return (
        <div className="flex w-full flex-col items-center justify-center gap-10">
            <div>
                <h1 className="font-bold text-2xl">Vos notifications</h1>
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-2 p-4">
                {notificationList.list.length > 0 ? (
                    <div className="flex w-full flex-col items-center justify-center gap-2">
                        <div className="flex w-full flex-row items-center gap-2 overflow-auto">
                            <Button variant="ghost" className="flex flex-row items-center justify-center gap-2" type="button">
                                <CheckCheckIcon className="size-6" />

                                Tout marquer comme lu
                            </Button>
                            <Button variant="ghost" className="flex flex-row items-center justify-center gap-2" type="button">
                                <Trash2Icon className="size-6" />

                                Tout supprimer
                            </Button>

                        </div>

                        <DisplayNotificationList notificationList={notificationList.list} />
                    </div>
                ) : (
                    <p>Vous n'avez pas de notification</p>
                )}
            </div>
        </div>
    )
}

const DisplayNotificationList = memo(function DisplayNotificationList({ notificationList }: { notificationList: NotificationList[] }) {
    return notificationList.map((notification) => {
        return (
            <Card className="w-full border-card-border" key={notification.notificationId}>
                <CardTitle className="p-4">
                    <Link to={notification.url} className="w-full">
                        {notification.title}
                    </Link>
                </CardTitle>
                <CardContent className="p-4">
                    <Link to={notification.url} className="w-full">
                        {notification.body}
                    </Link>
                </CardContent>
                <CardFooter className="gap-2 p-4 text-muted-foreground flex flex-col">
                    <p>{new Date(notification.createdAt || "").toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    })}</p>
                    <div className="flex flex-row items-center">
                        <Button variant="ghost" className="flex flex-row items-center justify-center gap-2" type="button">
                            <CheckCheckIcon className="size-6" />

                            Marquer comme lu
                        </Button>
                        <Button variant="ghost" className="flex flex-row items-center justify-center gap-2" type="button">
                            <Trash2Icon className="size-6" />

                            Supprimer
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        )
    })
})