import { CalendarDaysIcon } from "lucide-react";
import { memo, type ReactNode } from "react";
import { Button } from "../../components/ui/button";
// import { Link } from "@remix-run/react";
import type { TFunction } from "i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { countries, dateFns } from "../../i18n";
import { formatDistanceToNow } from "date-fns";
import type { Events } from "../../../../db/schema/events";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../components/ui/carousel";
import { Link } from "@tanstack/react-router";

export default function Index({
	t,
	language
}: {
	t: TFunction,
	language: string
}): ReactNode {
	return (
		<>
			<h2 className="mb-4 flex flex-row items-center gap-2 font-bold text-lg">
				<CalendarDaysIcon />
				{/* {t("nextEvents")} */}
			</h2>

			{/* <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2"> */}
			<DisplayNextEvents t={t} language={language} />
			{/* </div> */}

			<Link to=".">
				<Button variant="default">{t("seeMore")}</Button>
			</Link>
		</>
	)
}

const DisplayNextEvents = memo(function DisplayNextEvents({
	t,
	language
}: {
	t: TFunction
	language: string
}) {
	const importance: Record<number, string> = {
		[-1]: t("low"),
		0: t("medium"),
		1: t("high")
	}

	const {
		data: nextEvents,
		isPending,
		error
	} = useQuery<Events[]>({
		queryKey: ["importantEvents"],
		queryFn: async () => await fetch("/api/calendar/important").then((res) => res.json()),
		refetchOnWindowFocus: true
	})

	if (error) {
		// return <p>{t("errors.emptyEvents")}</p>
		return <p>Erreur</p>
	}

	if (isPending) {
		return (
			<Carousel className="h-full w-full max-w-[75%] lg:max-w-[90%]">
				<CarouselContent className="-ml-0 h-full justify-center">
					{new Array(10).fill(null).map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<CarouselItem key={index} className="flex h-full basis-full items-center justify-center p-0 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4">
							<Card className="relative size-full h-full whitespace-normal border-card-border sm:size-80">
								<CardHeader>
									<CardTitle className="text-center">
										<Skeleton className="h-6 w-1/2" />
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-4 p-4">
									<Skeleton className="h-24 w-full" />
									<div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 p-4 text-muted-foreground">
										<Skeleton className="h-4 w-1/2" />
										<Skeleton className="h-4 w-1/2" />
									</div>
								</CardContent>
							</Card>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious variant="default" />
				<CarouselNext variant="default" />
			</Carousel>
		)
	}

	if (!nextEvents || nextEvents.length <= 0) {
		return <p>{t("errors.emptyEvents")}</p>
	}

	return (
		<Carousel className="h-full w-full max-w-[75%] lg:max-w-[90%]">
			<CarouselContent className="-ml-0 h-full">
				{nextEvents.map((event) => (
					<CarouselItem key={event.id} className="flex h-full basis-full items-center justify-center p-0 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4">
						<Link to="." className="size-full h-full sm:size-80">
							<Card className="relative size-full h-full whitespace-normal border-card-border sm:size-80">
								<CardHeader>
									<CardTitle className="text-center">{event.title}</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-4 p-4">
									<p className="h-24 max-h-24 overflow-clip">{event.comment}</p>
									<div className="relative p-0 text-muted-foreground lg:absolute lg:bottom-0 lg:left-0 lg:p-4">
										<p>{t("importance")} : {importance[event.importance]}</p>
										<p>{t("country")} : {countries[language][event.country]}</p>
										<div className="flex flex-row items-center gap-1">
											<p>
												{formatDistanceToNow(new Date(event.date), {
													locale: dateFns[language],
													addSuffix: true
												})}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious variant="default" />
			<CarouselNext variant="default" />
		</Carousel>
	)
})