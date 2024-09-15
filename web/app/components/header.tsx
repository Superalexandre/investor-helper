import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { MdCalendarMonth, MdHome, MdNewspaper } from "react-icons/md"

export default function Header() {
    return (
        <header className="bg-slate-900 p-3">
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem key="home">
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/">
                            <MdHome className="mr-2 inline-block" />
                            
                            Accueil
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem key="news">
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/news">
                            <MdNewspaper className="mr-2 inline-block" />

                            News
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem key="calendar">
                        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "cursor-pointer")} href="/calendar">
                            <MdCalendarMonth className="mr-2 inline-block" />
                            
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