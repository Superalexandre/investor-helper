import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

export default function Header() {
    return (
        <header className="bg-slate-900 p-3">
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/">
                            Accueil
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/news">
                            News
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/calendar">
                            Calendrier
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
                {/* <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/login">
                            Se connecter
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/register">
                            S'inscrire
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList> */}
            </NavigationMenu>
        </header>
    )
}