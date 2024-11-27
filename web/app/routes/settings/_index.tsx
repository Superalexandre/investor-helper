import { useTranslation } from "react-i18next";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export const handle = {
    i18n: "settings"
}

export default function Index() {
    const { i18n } = useTranslation()

    return (
        <div>
            <div className="flex flex-col items-center justify-center space-y-4">
                <p className="pt-4 text-center font-bold text-2xl">Paramètres</p>
            </div>
            <div className="flex w-full flex-col items-center justify-center space-y-6 p-4 lg:p-10">
                <ChangeLanguage
                    language={i18n.language}
                />

                <ChangeTheme
                    theme="dark"
                />
            </div>
        </div>
    )
}

function ChangeLanguage({
    language
}: {
    language: string
}) {
    const handleChange = (value: string) => {
        console.log(value)
    }

    return (
        <div className="flex w-1/2 flex-col items-center justify-center gap-2">
            <Label htmlFor="language">Langue</Label>
            <Select name="language" defaultValue={language} onValueChange={(value) => handleChange(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Choisir une langue" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="fr-FR">Français (France)</SelectItem>
                    <SelectItem value="en-US">Anglais (États-Unis)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

function ChangeTheme({
    theme
}: {
    theme: string
}) {
    const handleChange = (value: string) => {
        console.log(value)
    }

    return (
        <div className="flex w-1/2 flex-col items-center justify-center gap-2">
            <Label htmlFor="theme">Theme</Label>
            <Select name="theme" defaultValue={theme} onValueChange={(value) => handleChange(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Choisir un theme" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="dark">Theme sombre</SelectItem>
                    <SelectItem value="light">Theme clair</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}