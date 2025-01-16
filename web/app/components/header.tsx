import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link, useLocation } from "@remix-run/react"
import { useState, memo } from "react"
import { Button } from "./ui/button"
import type { User } from "../../../db/schema/users"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"
import type { TFunction } from "i18next"
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	navigationMenuTriggerStyle
} from "./ui/navigation-menu"
import { Trigger as NavigationMenuPrimitiveTrigger } from "@radix-ui/react-navigation-menu"
import { BellIcon, CalendarDaysIcon, ChartCandlestickIcon, ChevronUpIcon, CircleUserRoundIcon, HomeIcon, LogInIcon, LogOutIcon, MenuIcon, NewspaperIcon, SearchIcon, SettingsIcon, UserRoundPlusIcon } from "lucide-react"

export const handle = {
	i18n: "header"
}

export default function Header({
	// logged,
	user,
	t,
	notificationNumber
}: {
	// logged: boolean,
	user: User | null
	t: TFunction
	notificationNumber: number
}) {
	const [open, setOpen] = useState(false)
	const location = useLocation()
	const fullUrl = `${location.pathname}${location.hash}${location.search}`

	return (
		<header className="relative h-16 touch-none bg-navbar-background text-navbar-foreground">
			<nav className="hidden h-full flex-row items-center justify-between gap-4 p-3 xl:flex">
				<div className="flex flex-row items-center">
					<Link to="/" className="mr-4 flex flex-row items-center gap-2">
						<img
							src="/logo-32-32.webp"
							loading="eager"
							alt="Investor Helper"
							className="mx-auto size-8"
							height="32"
							width="32"
						/>
						Investor helper
					</Link>

					{/* <Button variant="ghost">
						<Link to="/" className="flex flex-row items-center">
							<MdHome className="mr-2 inline-block" />
							{t("header.home")}
						</Link>
					</Button> */}

					<Button variant="ghost" className="p-0">
						<Link to="/news" className="flex flex-row items-center px-4 py-2">
							{/* <MdNewspaper className="mr-2 inline-block" /> */}
							<NewspaperIcon className="mr-2 inline-block size-5" />
							{t("header.news")}
						</Link>
					</Button>

					<Button variant="ghost" className="p-0">
						<Link to="/calendar" className="flex flex-row items-center px-4 py-2">
							<CalendarDaysIcon className="mr-2 inline-block size-5" />
							{t("header.calendar")}
						</Link>
					</Button>

					<Button variant="ghost" className="p-0">
						<Link to="/search" className="flex flex-row items-center px-4 py-2">
							<SearchIcon className="mr-2 inline-block size-5" />
							{t("header.search")}
						</Link>
					</Button>

					<SeeMore t={t} />
				</div>

				<div className="flex flex-row items-center">
					{user ? (
						<>
							<Button variant="ghost" className="p-0">
								<Link to="/profile" className="flex flex-row items-center gap-2 px-4 py-2">
									<img
										src={`https://api.dicebear.com/7.x/bottts/png?seed=${user.username}`}
										alt={user.username}
										className="size-6 rounded-full"
									/>

									{t("header.profile")}
								</Link>
							</Button>

							<Button variant="ghost" className="p-0">
								<Link to={`/logout?redirect=${fullUrl}`} className="flex flex-row items-center px-4 py-2">
									<LogOutIcon className="mr-2 inline-block size-5" />
									{t("header.logout")}
								</Link>
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" className="p-0">
								<Link to="/login" className="flex flex-row items-center px-4 py-2">
									<LogInIcon className="mr-2 inline-block size-5" />
									{t("header.login")}
								</Link>
							</Button>

							<Button variant="ghost" className="p-0">
								<Link to="/register" className="flex flex-row items-center px-4 py-2">
									<UserRoundPlusIcon className="mr-2 inline-block size-5" />
									{t("header.register")}
								</Link>
							</Button>
						</>
					)}
				</div>
			</nav>
			<Sheet open={open} onOpenChange={(openChange) => setOpen(openChange)}>
				<SheetTrigger
					className="block h-full p-3 xl:hidden"
					name="Open sidebar"
					aria-label="Ouvrir le menu déroulant"
				>
					<div className="relative size-6">
						{notificationNumber > 0 ? (
							<PingIndicator className="-top-[0.5px]" />
						) : null}

						<MenuIcon className="size-full" />
					</div>
				</SheetTrigger>
				<SheetContent
					side="left"
					className="flex flex-col items-center justify-between p-0 pt-16 pb-2 xl:hidden"
				>
					<SheetTitle className="hidden">{t("header.sheetTitle")}</SheetTitle>
					<SheetDescription className="hidden">{t("header.sheetDescription")}</SheetDescription>

					<div className="flex w-full flex-col items-center gap-4">
						<Link to="/" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
							<HomeIcon className="mr-2 inline-block size-5" />
							{t("header.home")}
						</Link>

						<Link to="/news" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
							<NewspaperIcon className="mr-2 inline-block size-5" />
							{t("header.news")}
						</Link>

						<Link
							to="/calendar"
							className="flex flex-row items-center text-xl"
							onClick={() => setOpen(false)}
						>
							<CalendarDaysIcon className="mr-2 inline-block size-5" />
							{t("header.calendar")}
						</Link>

						<SeeMore t={t} onClick={() => setOpen(false)} />
					</div>

					{user ? (
						<FooterLogged user={user} setOpen={setOpen} t={t} notificationNumber={notificationNumber} location={fullUrl} />
					) : (
						<FooterNotLogged setOpen={setOpen} t={t} />
					)}
				</SheetContent>
			</Sheet>
			<div className="block xl:hidden">
				<div className="absolute inset-y-0 right-0 mr-3 flex h-full flex-row items-center justify-center">
					<Button className="flex h-9 flex-row items-center justify-center gap-2 px-8" asChild={true}>
						<Link to="/search" className="flex h-9 flex-row items-center justify-center gap-2 px-8">
							<SearchIcon className="size-5" />
							{t("header.search")}
						</Link>
					</Button>
				</div>
			</div>

			{/* <Separator className="w-full h-[2px]" /> */}
		</header>
	)
}

const SeeMore = memo(function SeeMore({
	t,
	onClick
}: {
	t: TFunction
	onClick?: () => void
}) {
	const menu = [
		{
			to: "/heatmap",
			icon: <ChartCandlestickIcon className="mr-2 inline-block size-5" />,
			label: t("header.heatmap")
		},
		{
			to: "/settings",
			icon: <SettingsIcon className="mr-2 inline-block size-5" />,
			label: t("header.settings")
		}
	]

	return (
		<>
			<NavigationMenu className="hidden xl:flex">
				<NavigationMenuList>
					<NavigationMenuItem>
						<NavigationMenuPrimitiveTrigger asChild={true}>
							<Button variant="ghost">{t("header.seeMore")}</Button>
						</NavigationMenuPrimitiveTrigger>
						<NavigationMenuContent>
							<NavigationMenuList className="flex flex-col justify-center gap-2 p-2">
								{menu.map((item) => (
									<NavigationMenuItem key={item.to} className="w-full">
										<Link
											to={item.to}
											className={cn(navigationMenuTriggerStyle(), "w-full")}
											onClick={onClick}
										>
											{item.icon}

											{item.label}
										</Link>
									</NavigationMenuItem>
								))}
								{/* <NavigationMenuItem className="w-full">
								<Link
									to="/heatmap"
									className={cn(navigationMenuTriggerStyle(), "w-full")}
									onClick={onClick}
								>
									<ChartCandlestickIcon className="mr-2 inline-block size-5" />

									{t("header.heatmap")}
								</Link>
							</NavigationMenuItem>
							<NavigationMenuItem className="w-full">
								<Link
									to="/settings"
									className={cn(navigationMenuTriggerStyle(), "w-full")}
									onClick={onClick}
								>
									<SettingsIcon className="mr-2 inline-block size-5" />

									{t("header.settings")}
								</Link>
							</NavigationMenuItem> */}
							</NavigationMenuList>
						</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>

			<div className="flex flex-col items-center gap-4 xl:hidden">
				<Link to="/heatmap" className="flex flex-row items-center text-xl" onClick={onClick}>
					<ChartCandlestickIcon className="mr-2 inline-block size-5" />
					{t("header.heatmap")}
				</Link>

				<Link to="/settings" className="flex flex-row items-center text-xl" onClick={onClick}>
					<SettingsIcon className="mr-2 inline-block size-5" />
					{t("header.settings")}
				</Link>
			</div>
		</>
	)
})

function PingIndicator({
	className
}: {
	className?: string
}) {
	return (
		<div className={cn("-top-0.5 -right-0.5 absolute", className)}>
			<div className="relative">
				<div className=" size-2 rounded-full bg-red-500" />
				<div className="absolute top-0 size-2 animate-ping rounded-full bg-red-600" />

			</div>

		</div>
	)
}

function FooterLogged({
	user,
	setOpen,
	t,
	notificationNumber,
	location
}: {
	user: User
	setOpen: (open: boolean) => void
	t: TFunction,
	notificationNumber: number,
	location: string
}) {
	const [dropdownOpen, setDropdownOpen] = useState(false)

	return (
		<div className="w-full px-2">
			<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
				<DropdownMenuTrigger className="relative flex w-full flex-row items-center justify-between">
					{notificationNumber > 0 ? (
						<PingIndicator />
					) : null}

					<Button variant="outline" className="flex w-full flex-row items-center justify-between py-6">
						<div className="flex flex-row items-center gap-2">
							<img
								src={`https://api.dicebear.com/7.x/bottts/png?seed=${user.username}`}
								alt={user.username}
								className="size-8 rounded-full"
							/>

							{user.displayName || user.username}
						</div>

						<ChevronUpIcon className={cn(dropdownOpen ? "rotate-180" : "", "size-6 duration-100")} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-[--radix-popper-anchor-width]">
					<DropdownMenuItem asChild={true} className="w-full p-0">
						<Link to="/profile/notifications" className="w-full hover:cursor-pointer" onClick={() => setOpen(false)}>
							<Button variant="ghost" className="flex w-full flex-row justify-start gap-2 px-2">
								<BellIcon className="size-6" />

								Notifications

								{notificationNumber > 0 ? (
									<span className="ml-auto flex size-7 items-center justify-center rounded-full bg-red-500 text-white">{notificationNumber > 99 ? "99+" : notificationNumber}</span>
								) : null}
							</Button>
						</Link>
					</DropdownMenuItem>

					<DropdownMenuItem asChild={true} className="w-full p-0">
						<Link to="/profile" className="w-full hover:cursor-pointer" onClick={() => setOpen(false)}>
							<Button variant="ghost" className="flex w-full flex-row justify-start gap-2 px-2">
								<CircleUserRoundIcon className="size-5" />

								{t("header.profile")}
							</Button>
						</Link>
					</DropdownMenuItem>

					<DropdownMenuItem asChild={true} className="w-full p-0">
						<Link to={`/logout?redirect=${location}`} className="w-full hover:cursor-pointer" onClick={() => setOpen(false)}>
							<Button variant="ghost" className="flex w-full flex-row justify-start gap-2 px-2">
								<LogOutIcon className="size-5" />

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
	setOpen: (open: boolean) => void
	t: TFunction
}) {
	return (
		<div className="flex w-full flex-col items-center gap-4 p-2">
			<Separator />

			<Link to="/login" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
				<LogInIcon className="mr-2 inline-block size-5" />
				{t("header.login")}
			</Link>
			<Link to="/register" className="flex flex-row items-center text-xl" onClick={() => setOpen(false)}>
				<UserRoundPlusIcon className="mr-2 inline-block size-5" />
				{t("header.register")}
			</Link>
		</div>
	)
}
