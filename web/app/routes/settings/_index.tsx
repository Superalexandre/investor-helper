import { useTranslation } from "react-i18next";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { changeLanguage, type TFunction } from "i18next";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import i18next from "../../i18next.server";
import { redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { getSession, sessionStorage, changeLanguage as changeLanguageSession, changeTheme } from "../../session.server";
import i18n from "../../i18n";
import { getTheme } from "../../lib/getTheme";

export async function action({ request }: ActionFunctionArgs) {
    // Get the action data (change language, change theme, etc.)
    // from the request body
    const data = await request.json()

    if (!data || !data.type || !data.value) {
        return {
            success: false,
            error: true,
            message: "Invalid request"
        }
    }

    console.log(data)

    if (data.type === "language") {
        if (!data.value || !i18n.supportedLngs.includes(data.value)) {
            return {
                success: false,
                error: true,
                message: "Invalid language"
            }
        }

        return changeLanguageSession({
            language: data.value,
            request: request,
            redirectUrl: "/settings"
        })
    }

    if (data.type === "theme") {
        if (!data.value || !["dark", "light"].includes(data.value)) {
            return {
                success: false,
                error: true,
                message: "Invalid language"
            }
        }

        return changeTheme({
            theme: data.value,
            request: request,
            redirectUrl: "/settings"
        })
    }

    return {
        success: false,
        error: true,
        message: "Invalid request"
    }
}

export async function loader({ request }: LoaderFunctionArgs) {
    const t = await i18next.getFixedT(request, "settings")
    const theme = await getTheme(request)

    const title = t("title")
    const description = t("description")

    return {
        theme: theme,
        title: title,
        description: description
    }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    if (!data) {
        return []
    }

    const { title, description } = data

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: "https://www.investor-helper.com/register" }
    ]
}

export const handle = {
    i18n: "settings"
}

export default function Index() {
    const { t, i18n } = useTranslation("settings")
    const { theme } = useLoaderData<typeof loader>()

    return (
        <div>
            <div className="flex flex-col items-center justify-center space-y-4">
                <p className="pt-4 text-center font-bold text-2xl">{t("settings")}</p>
            </div>
            <div className="flex w-full flex-col items-center justify-center space-y-6 p-4 lg:p-10">
                <ChangeLanguage
                    language={i18n.language}
                    t={t}
                />

                <ChangeTheme
                    theme={theme}
                    t={t}
                />
            </div>
        </div>
    )
}

function ChangeLanguage({
    language,
    t
}: {
    language: string,
    t: TFunction
}) {
    const fetcher = useFetcher()

    const handleChange = (value: string) => {
        changeLanguage(value)

        fetcher.submit({
            type: "language",
            value: value
        }, {
            method: "POST",
            action: "/settings",
            encType: "application/json",
        })
    }

    return (
        <fetcher.Form method="POST" action="/settings" className="flex w-1/2 flex-col items-center justify-center gap-2">
            <Label htmlFor="language">{t("language")}</Label>
            <Select name="language" defaultValue={language} onValueChange={handleChange}>
                <SelectTrigger>
                    <SelectValue placeholder={t("chooseLanguage")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="fr-FR">Français (France)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
            </Select>
        </fetcher.Form>
    )
}

function ChangeTheme({
    theme,
    t
}: {
    theme: string,
    t: TFunction
}) {
    const fetcher = useFetcher()

    const handleChange = (value: string) => {
        fetcher.submit({
            type: "theme",
            value: value
        }, {
            method: "POST",
            action: "/settings",
            encType: "application/json",
        })
    }

    return (
        <fetcher.Form className="flex w-1/2 flex-col items-center justify-center gap-2">
            <Label htmlFor="theme">{t("theme")}</Label>
            <Select name="theme" defaultValue={theme} onValueChange={(value) => handleChange(value)}>
                <SelectTrigger>
                    <SelectValue placeholder={t("chooseTheme")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="dark">{t("dark")}</SelectItem>
                    <SelectItem value="light">{t("light")}</SelectItem>
                </SelectContent>
            </Select>
        </fetcher.Form>
    )
}