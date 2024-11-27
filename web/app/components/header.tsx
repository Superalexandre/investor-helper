import {
	MdAdd,
	MdArrowDropUp,
	MdCalendarMonth,
	MdHome,
	MdLogin,
	MdLogout,
	MdMenu,
	MdNewspaper,
	// MdNotifications,
	MdPerson,
	MdSearch,
	MdSettings,
	MdWaterfallChart
} from "react-icons/md"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link } from "@remix-run/react"
import { useState, memo } from "react"
import { Button } from "./ui/button"
import type { User } from "../../../db/schema/users"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"
import type { TFunction } from "i18next"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu"
import { Trigger as NavigationMenuPrimitiveTrigger } from "@radix-ui/react-navigation-menu"

export const handle = {
	i18n: "header"
}

export default function Header(
	{
		// logged,
		user,
		t
	}: {
		// logged: boolean,
		user: User | null,
		t: TFunction
	}
) {
	const [open, setOpen] = useState(false)
	// const menuItems = [
	// 	[
	// 		{
	// 			key: "home",
	// 			icon: MdHome,
	// 			label: t("header.home"),
	// 			href: "/",
	// 			hidden: false
	// 		},
	// 		{
	// 			key: "news",
	// 			icon: MdNewspaper,
	// 			label: t("header.news"),
	// 			href: "/news",
	// 			hidden: false
	// 		},
	// 		{
	// 			key: "calendar",
	// 			icon: MdCalendarMonth,
	// 			label: t("header.calendar"),
	// 			href: "/calendar",
	// 			hidden: false
	// 		},
	// 		{
	// 			key: "search",
	// 			icon: MdSearch,
	// 			label: t("header.search"),
	// 			href: "/search",
	// 			hidden: false
	// 		}
	// 	],
	// 	[
	// 		{
	// 			key: "profile",
	// 			icon: MdPerson,
	// 			label: t("header.profile"),
	// 			href: "/profile",
	// 			hidden: !logged
	// 		},
	// 		{
	// 			key: "logout",
	// 			icon: MdLogout,
	// 			label: t("header.logout"),
	// 			href: "/logout",
	// 			hidden: !logged
	// 		},
	// 		{
	// 			key: "login",
	// 			icon: MdLogin,
	// 			label: t("header.login"),
	// 			href: "/login",
	// 			hidden: logged
	// 		},
	// 		{
	// 			key: "register",
	// 			icon: MdAdd,
	// 			label: t("header.register"),
	// 			href: "/register",
	// 			hidden: logged
	// 		}
	// 	]
	// ]

	// const [{ x }, api] = useSpring(() => ({ x: "-100%" }))

	// Function to open/close the sidebar
	// const toggleSidebar = (isOpen: boolean) => {
	// 	setOpen(isOpen)
	// 	api.start({ x: isOpen ? "0" : "-100%" })
	// }

	// Gesture handling
	// const bind = useDrag(
	// 	({ down, movement: [mx], memo = x.get() }) => {
	// 		console.log(mx)

	// 		if (mx > 0 || (mx < 0 && memo + mx > -300)) {
	// 			setOpen(true)
	// 			api.start({ x: down ? mx + memo : open ? 0 : -300 })
	// 		}
	// 		if (!down && mx < -150) {
	// 			setOpen(false)
	// 			api.start({ x: "-100%" })
	// 		} else if (!down && mx > 150) {
	// 			setOpen(true)
	// 			api.start({ x: "0" })
	// 		}
	// 		return memo
	// 	},
	// 	{
	// 		axis: "x",
	// 		bounds: { left: -300, right: 0 },
	// 		rubberband: true
	// 	}
	// )

	//{...bind()}

	return (
		<header className="relative h-16 touch-none bg-slate-300 dark:bg-slate-900">
			<nav className="hidden h-full flex-row items-center justify-between gap-4 p-3 xl:flex">
				<div className="flex flex-row items-center">
					{/* <Link to="/" className="mr-4 flex flex-row items-center gap-2">
						<img
							src="/logo-32-32.webp"
							loading="eager"
							alt="Investor Helper"
							className="mx-auto size-8"
							height="32"
							width="32"
						/>

						Investor helper
					</Link> */}


					<Button variant="ghost">
						<Link to="/" className="flex flex-row items-center">
							<MdHome className="mr-2 inline-block" />
							{t("header.home")}
						</Link>
					</Button>

					<Button variant="ghost">
						<Link to="/news" className="flex flex-row items-center">
							<MdNewspaper className="mr-2 inline-block" />
							{t("header.news")}
						</Link>
					</Button>

					<Button variant="ghost">
						<Link to="/calendar" className="flex flex-row items-center">
							<MdCalendarMonth className="mr-2 inline-block" />
							{t("header.calendar")}
						</Link>
					</Button>

					<Button variant="ghost">
						<Link to="/search" className="flex flex-row items-center">
							<MdSearch className="mr-2 inline-block" />
							{t("header.search")}
						</Link>
					</Button>

					{/* <SeeMore t={t} /> */}
				</div>

				<div className="flex flex-row items-center">
					{user ? (
						<>
							<Button variant="ghost">
								<Link to="/profile" className="flex flex-row items-center gap-2">
									<img src={`https://api.dicebear.com/7.x/bottts/png?seed=${user.username}`} alt={user.username} className="size-6 rounded-full" />

									{t("header.profile")}
								</Link>
							</Button>

							<Button variant="ghost">
								<Link to="/logout" className="flex flex-row items-center">
									<MdLogout className="mr-2 inline-block" />
									{t("header.logout")}
								</Link>
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost">
								<Link to="/login" className="flex flex-row items-center">
									<MdLogin className="mr-2 inline-block" />
									{t("header.login")}
								</Link>
							</Button>

							<Button variant="ghost">
								<Link to="/register" className="flex flex-row items-center">
									<MdAdd className="mr-2 inline-block" />
									{t("header.register")}
								</Link>
							</Button>
						</>
					)}
				</div>
			</nav >
			<Sheet
				open={open}
				onOpenChange={(openChange) => setOpen(openChange)}
			>
				<SheetTrigger
					className="block h-full p-3 xl:hidden"
					name="Open sidebar"
					aria-label="Ouvrir le menu déroulant"
				>
					<div className="relative size-6">
						{/* <PingIndicator className="-top-[0.5px]"/> */}

						<MdMenu className="size-full" />
					</div>
				</SheetTrigger>
				<SheetContent side="left" className="flex flex-col items-center justify-between p-0 pt-16 pb-2 xl:hidden">
					<SheetTitle className="hidden">{t("header.sheetTitle")}</SheetTitle>
					<SheetDescription className="hidden">{t("header.sheetDescription")}</SheetDescription>

					<div className="flex w-full flex-col items-center gap-4">
						<Link to="/" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
							<MdHome className="mr-2 inline-block" />
							{t("header.home")}
						</Link>

						<Link to="/news" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
							<MdNewspaper className="mr-2 inline-block" />
							{t("header.news")}
						</Link>

						<Link to="/calendar" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
							<MdCalendarMonth className="mr-2 inline-block" />
							{t("header.calendar")}
						</Link>
					</div>

					{user ? <FooterLogged user={user} setOpen={setOpen} t={t} /> : <FooterNotLogged setOpen={setOpen} t={t} />}
				</SheetContent>
			</Sheet>
			<div className="block xl:hidden">
				<Link to="/search" className="absolute inset-y-0 right-0 mr-3 flex flex-row items-center">
					<Button className="px-8">
						<MdSearch className="size-6" />
						{t("header.search")}
					</Button>
				</Link>
			</div>

			{/* <Separator className="w-full h-[2px]" /> */}
		</header >
	)
}

const SeeMore = memo(function SeeMore({
	t
}: {
	t: TFunction
}) {
	return (
		<NavigationMenu >
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuPrimitiveTrigger asChild={true}>
						<Button variant="ghost">
							{t("header.seeMore")}
						</Button>
					</NavigationMenuPrimitiveTrigger>
					<NavigationMenuContent>
						<NavigationMenuList className="flex flex-col gap-2 p-2">
							<NavigationMenuItem>
								<Link to="/heatmap" className={navigationMenuTriggerStyle()}>
									<MdWaterfallChart className="mr-2 inline-block" />

									{t("header.heatmap")}
								</Link>
							</NavigationMenuItem>
							<NavigationMenuItem className="w-full">
								<Link to="/settings" className={navigationMenuTriggerStyle()}>
									<MdSettings className="mr-2 inline-block" />

									{t("header.settings")}
								</Link>
							</NavigationMenuItem>
						</NavigationMenuList>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	)
})

// function PingIndicator({
// 	className
// }: {
// 	className?: string
// }) {
// 	return (
// 		<div className={cn("-top-0.5 -right-0.5 absolute size-2 rounded-full bg-red-500", className)} />
// 	)
// }

function FooterLogged({
	user,
	setOpen,
	t
}: {
	user: User,
	setOpen: (open: boolean) => void,
	t: TFunction
}) {
	const [dropdownOpen, setDropdownOpen] = useState(false)

	return (
		<div className="w-full px-2">
			<DropdownMenu
				open={dropdownOpen}
				onOpenChange={setDropdownOpen}
			>
				<DropdownMenuTrigger className="relative flex w-full flex-row items-center justify-between">
					{/* <PingIndicator /> */}

					<Button variant="outline" className="flex w-full flex-row items-center justify-between py-6">
						<div className="flex flex-row items-center gap-2">
							<img src={`https://api.dicebear.com/7.x/bottts/png?seed=${user.username}`} alt={user.username} className="size-8 rounded-full" />

							{user.displayName || user.username}
						</div>

						<MdArrowDropUp className={cn(dropdownOpen ? "rotate-180" : "", "size-6 duration-100")} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-[--radix-popper-anchor-width]">
					{/* <DropdownMenuItem asChild={true} className="w-full p-0">
						<Link to="/" className="w-full hover:cursor-pointer" onClick={() => setOpen(false)}>
							<Button variant="ghost" className="flex w-full flex-row justify-start gap-2 px-2">
								<MdNotifications className="size-6" />

								Notifications

								<span className="ml-auto flex size-7 items-center justify-center rounded-full bg-red-500 text-white">10</span>
							</Button>
						</Link>
					</DropdownMenuItem> */}

					<DropdownMenuItem asChild={true} className="w-full p-0">
						<Link to="/profile" className="w-full hover:cursor-pointer" onClick={() => setOpen(false)}>
							<Button variant="ghost" className="flex w-full flex-row justify-start gap-2 px-2">
								<MdPerson className="size-6" />

								{t("header.profile")}
							</Button>
						</Link>
					</DropdownMenuItem>

					<DropdownMenuItem asChild={true} className="w-full p-0">
						<Link to="/logout" className="w-full hover:cursor-pointer" onClick={() => setOpen(false)}>
							<Button variant="ghost" className="flex w-full flex-row justify-start gap-2 px-2">
								<MdLogout className="size-6" />

								{t("header.logout")}
							</Button>
						</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

		</div>
	)
}

function FooterNotLogged({
	setOpen,
	t
}: {
	setOpen: (open: boolean) => void,
	t: TFunction
}) {
	return (
		<div className="flex w-full flex-col items-center gap-4 p-2">
			<Separator />

			<Link to="/login" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
				<MdLogin className="mr-2 inline-block" />
				{t("header.login")}
			</Link>
			<Link to="/register" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
				<MdAdd className="mr-2 inline-block" />
				{t("header.register")}
			</Link>
		</div>
	)
}
