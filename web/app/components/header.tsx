import { MdAdd, MdCalendarMonth, MdHome, MdLogin, MdLogout, MdMenu, MdNewspaper, MdPerson, MdSearch } from "react-icons/md"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Link } from "@remix-run/react"
import { useState } from "react"
import { Button } from "./ui/button"

export default function Header({
    logged
}: {
    logged: boolean
} = { logged: false }) {
    const [open, setOpen] = useState(false)
    const menuItems = [
        [
            {
                key: "home",
                icon: MdHome,
                label: "Accueil",
                href: "/",
                hidden: false
            },
            {
                key: "news",
                icon: MdNewspaper,
                label: "News",
                href: "/news",
                hidden: false
            },
            {
                key: "calendar",
                icon: MdCalendarMonth,
                label: "Calendrier",
                href: "/calendar",
                hidden: false
            },
            {
                key: "search",
                icon: MdSearch,
                label: "Rechercher",
                href: "/search",
                hidden: false
            }
        ], /*[
            {
                key: "search",
                icon: null,
                label: "Rechercher",
                href: "/search",
                hidden: false
            }
        ],*/ [
            {
                key: "profile",
                icon: MdPerson,
                label: "Profile",
                href: "/profile",
                hidden: !logged
            },
            {
                key: "logout",
                icon: MdLogout,
                label: "Déconnexion",
                href: "/logout",
                hidden: !logged
            },
            {
                key: "login",
                icon: MdLogin,
                label: "Connexion",
                href: "/login",
                hidden: logged
            },
            {
                key: "register",
                icon: MdAdd,
                label: "Inscription",
                href: "/register",
                hidden: logged
            }
        ],
    ]

    return (
        <header className="relative h-16 bg-slate-900 p-3">
            <nav className="hidden h-full flex-row items-center justify-between gap-4 xl:flex">
                {menuItems.map((menuGroup, index) => (
                    <div key={index} className="flex flex-row items-center gap-4">
                        {menuGroup.map((menuItem) => (
                            menuItem.hidden ? null : (
                                <Link to={menuItem.href} key={menuItem.key} className="flex flex-row content-center items-center justify-center">
                                    {menuItem.icon ? <menuItem.icon className="mr-2 inline-block" /> : null}
                                    {menuItem.label}
                                </Link>
                            )
                        ))}
                    </div>
                ))}
            </nav>
            <Sheet open={open} onOpenChange={(openChange) => setOpen(openChange)}>
                <SheetTrigger className="block h-full xl:hidden" name="Open sidebar" aria-label="Ouvrir le menu déroulant">
                    <MdMenu className="size-6" />
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col items-center justify-between pt-16">
                    <SheetTitle className="hidden">Menu</SheetTitle>
                    <SheetDescription className="hidden">Navigation principale</SheetDescription>

                    {menuItems.map((menuGroup, index) => (
                        <div key={index} className="flex flex-col items-center gap-4">
                            {menuGroup.map((menuItem) => (
                                menuItem.hidden ? null : menuItem.key === "search" ? null : (
                                    <Link to={menuItem.href} key={menuItem.key} className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
                                        {menuItem.icon ? <menuItem.icon className="mr-2 inline-block" /> : null}
                                        {menuItem.label}
                                    </Link>
                                )
                            ))}
                        </div>
                    ))}
                </SheetContent>
            </Sheet>
            <div className="block xl:hidden">
                <Link to="/search" className="absolute inset-y-0 right-0 mr-3 flex flex-row items-center">
                    <Button className="px-8">
                        <MdSearch className="size-6" />

                        Rechercher
                    </Button>
                </Link>
            </div>
        </header>
    )
}