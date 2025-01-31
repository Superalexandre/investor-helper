import { CalendarDaysIcon } from "lucide-react";
import { memo, type ReactNode } from "react";
import { Button } from "../../components/ui/button";
import { Link } from "@remix-run/react";
import type { TFunction } from "i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { countries, dateFns } from "../../i18n";
import { formatDistanceToNow } from "date-fns";
import type { Events } from "../../../../db/schema/events"

export default function Index({
    t,
    language
}: {
    t: TFunction,
    language: string
}): ReactNode {
    return (

        <>
            <h2 className="flex flex-row items-center gap-2 font-bold text-lg">
                <CalendarDaysIcon />

                {t("nextEvents")}
            </h2>

            <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
                <DisplayNextEvents t={t} language={language} />
            </div>

            <Link to="/calendar">
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
		queryFn: async () => {
			const req = await fetch("/api/calendar/important")
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	if (error) {
		return <p>{t("errors.emptyEvents")}</p>
	}

	if (isPending) {
		return new Array(10).fill(null).map((_, index) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={index}>
				<CardTitle className="p-4 text-center">
					<Skeleton className="h-6 w-1/2" />
				</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<Skeleton className="h-24 w-full" />

					<div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 p-4 text-muted-foreground">
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</CardContent>
			</Card>
		))
	}

	if (!nextEvents || nextEvents.length <= 0) {
		return <p>{t("errors.emptyEvents")}</p>
	}

	return nextEvents.map((event) => (
		<Link to={`/calendar/${event.id}`} key={event.id}>
			<Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border">
				<CardTitle className="p-4 text-center">{event.title}</CardTitle>
				<CardContent className="flex flex-col gap-4 p-4">
					<p className="h-24 max-h-24 overflow-clip">{event.comment}</p>

					<div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
						<p>
							{t("importance")} : {importance[event.importance]}
						</p>
						<p>
							{t("country")} : {countries[language][event.country]}
						</p>
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
	))
})