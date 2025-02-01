import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { ClockIcon } from "lucide-react";
import { memo, useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { format, toDate, fromZonedTime, } from "date-fns-tz"
import { differenceInSeconds } from "date-fns";
import type { MarketStatus } from "../../../types/Hours"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../components/ui/carousel";

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
                <ClockIcon />

                {t("marketHours")}
            </h2>

            {/* <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full max-w-[80%]"
            >
                <CarouselContent className="-ml-4">
                    <DisplayHours t={t} language={language} />
                </CarouselContent>

                <CarouselPrevious />
                <CarouselNext />
            </Carousel> */}

            <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex w-full max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2 ">
                <DisplayHours t={t} language={language} />
            </div>
        </>
    )
}

const DisplayHours = memo(function DisplayHours({
    t,
    language
}: {
    t: TFunction
    language: string
}) {
    const [actualDate, setActualDate] = useState(new Date())

    const {
        data: hours,
        isPending,
        error
    } = useQuery<MarketStatus[]>({
        queryKey: ["hours"],
        queryFn: async () => {
            const req = await fetch("/api/hours")
            const json = await req.json()

            return json
        },
        refetchOnWindowFocus: true
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setActualDate(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    if (error) {
        return <p>{t("errors.loading")}</p>
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

    if (!hours || hours?.length <= 0) {
        return <p>{t("errors.emptyHours")}</p>
    }

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const formatDistance = (marketDate: Date, marketTimezone: string): string => {
        const marketDateTimezone = fromZonedTime(marketDate, marketTimezone)
        marketDateTimezone.setSeconds(0) // Avoiding seconds to avoid flickering

        // Convertir la date en date locale
        const marketDateLocal = toDate(marketDateTimezone)

        // Calculer la différence en secondes
        const diff = differenceInSeconds(marketDateLocal, actualDate)

        const diffInHours = diff / 3600
        const diffInMinutes = diff / 60
        const diffInSeconds = diff

        // Formater la différence
        let formatted = ""

        if (diffInHours > 0) {
            formatted += `${Math.floor(diffInHours)}h `
        }

        if (diffInMinutes > 0) {
            formatted += `${Math.floor(diffInMinutes % 60)}m `
        }

        if (diffInSeconds > 0) {
            formatted += `${Math.floor(diffInSeconds % 60)}s`
        }

        return formatted
    }

    const getOpeningTimeInUserLocal = (
        marketDate: Date,
        marketTimezone: string
    ): string => {
        const marketDateTimezone = fromZonedTime(marketDate, marketTimezone)

        // Formater la date
        return format(marketDateTimezone, "HH:mm", {
            timeZone: userTimezone
        });
    };

    const formatDecimalTime = (decimalTime: number): string => {
        // Séparer les parties entière et décimale
        const hours = Math.floor(decimalTime);
        const minutes = Math.round((decimalTime % 1) * 60);

        // Formater avec deux chiffres pour les heures et minutes
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // return (
    // 	<Card className="border-card-border w-full">
    // 		<CardContent className="w-full flex flex-col items-center gap-4">
    // 			{hours.map((hour) => (
    // 				<div className="flex flex-row items-center gap-2" key={hour.marketId}>
    // 					{hour.hasLogo ? (
    // 						<img
    // 							src={`/logo/${hour.marketId}.png`}
    // 							alt={hour.marketName}
    // 							className="rounded-full size-6"
    // 							loading="lazy"
    // 							width="48"
    // 							height="48"
    // 						/>
    // 					) : null}

    // 					{hour.marketName}

    // 					{hour.open ? <OpenIndicator /> : <CloseIndicator />}

    // 					<p>
    // 						{hour.open ? "Ouvert" : `Fermé ${hour.closeReason !== "close" ? hour.closeReason : ""}`}
    // 					</p>


    // 					{hour.open ? (
    // 						<div className="flex flex-col">
    // 							<p>
    // 								Fermeture à {getOpeningTimeInUserLocal(hour.nextCloseDate, hour.timezone)} ({formatDecimalTime(hour.closeHour)}h heure locale)
    // 							</p>
    // 							<p>
    // 								Dans {formatDistance(hour.nextCloseDate, hour.timezone)}
    // 							</p>
    // 						</div>
    // 					) : (
    // 						<div className="flex flex-col">
    // 							<p>
    // 								Ouverture à {getOpeningTimeInUserLocal(hour.nextOpenDate, hour.timezone)} ({formatDecimalTime(hour.openHour)}h heure locale)
    // 							</p>
    // 							<p>
    // 								Dans {formatDistance(hour.nextOpenDate, hour.timezone)}
    // 							</p>
    // 						</div>
    // 					)}
    // 				</div>
    // 			))}
    // 		</CardContent>
    // 	</Card>
    // )

    return hours.map((hour) => (
        // <CarouselItem key={hour.marketId} className="flex basis-full justify-center pl-4 lg:basis-auto">
        <Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={hour.marketId}>
            <CardTitle className="flex flex-row items-center justify-center gap-2 p-4 text-center">
                {hour.hasLogo ? (
                    <img
                        src={`/logo/${hour.marketId}.png`}
                        alt={hour.marketName}
                        className="rounded-full size-6"
                        loading="lazy"
                        width="48"
                        height="48"
                    />
                ) : null}

                {hour.marketName}
            </CardTitle>
            <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex flex-row items-center justify-center gap-2">

                    {hour.open ? <OpenIndicator /> : <CloseIndicator />}

                    <p>
                        {hour.open ? t("open") : `${t("closed")} ${hour.closeReason !== "close" ? hour.closeReason : ""}`}
                    </p>
                </div>

                {hour.open ? (
                    <div className="flex flex-col">
                        <p>
                            {t("closingAt")} {getOpeningTimeInUserLocal(hour.nextCloseDate, hour.timezone)} ({formatDecimalTime(hour.closeHour)}{t("hourIndicator")} {t("localTime")})
                        </p>
                        <p>
                            {t("in")} {formatDistance(hour.nextCloseDate, hour.timezone)}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <p>
                            {t("openingAt")} {getOpeningTimeInUserLocal(hour.nextOpenDate, hour.timezone)} ({formatDecimalTime(hour.openHour)}{t("hourIndicator")} {t("localTime")})
                        </p>
                        <p>
                            {t("in")} {formatDistance(hour.nextOpenDate, hour.timezone)}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
        // </CarouselItem>
    ))
})

const OpenIndicator = memo(function OpenIndicator() {
    return (
        <div className="relative">
            <div className="size-2 rounded-full bg-green-500" />
            <div className="absolute top-0 size-2 animate-ping rounded-full bg-green-600 duration-1000" />
        </div>
    )
})

const CloseIndicator = memo(function CloseIndicator() {
    return (
        <div className="relative">
            <div className="size-2 rounded-full bg-red-500" />
            <div className="absolute top-0 size-2 animate-ping rounded-full bg-red-600 duration-1000" />
        </div>
    )
})