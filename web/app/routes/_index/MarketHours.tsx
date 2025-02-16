import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import { memo, useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { format, toDate, fromZonedTime, } from "date-fns-tz"
import { differenceInSeconds } from "date-fns";
import type { MarketStatus } from "../../../types/Hours"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../components/ui/carousel";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

export default function Index({
    t,
    language
}: {
    t: TFunction,
    language: string
}): ReactNode {
    return (
        <>
            <h2 className="flex flex-row items-center gap-2 font-bold text-lg mb-4">
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
        queryFn: async () => await fetch("/api/hours").then((res) => res.json()),
        refetchOnWindowFocus: true
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setActualDate(new Date())
        }, 1000)

        return (): void => clearInterval(interval)
    }, [])

    if (error) {
        return <p>{t("errors.loading")}</p>
    }

    if (isPending) {
        return new Array(10).fill(null).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border" key={index}>
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

    return (
        <Card className="w-full border-card-border">
            {/* <CardContent className="flex w-full flex-col flex-wrap items-center justify-between gap-4 p-4 md:flex-row"> */}
            <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {hours.map((hour) => (
                    <MarketHourCard
                        key={hour.marketId}
                        hour={hour}
                        t={t}
                        getOpeningTimeInUserLocal={getOpeningTimeInUserLocal}
                        formatDistance={formatDistance}
                        formatDecimalTime={formatDecimalTime}
                    />
                ))}
            </CardContent>
        </Card>
    )
})

const MarketHourCard = memo(function MarketHourCard({
    hour,
    t,
    getOpeningTimeInUserLocal,
    formatDistance,
    formatDecimalTime,
}: {
    hour: MarketStatus
    t: TFunction
    getOpeningTimeInUserLocal: (marketDate: Date, marketTimezone: string) => string
    formatDistance: (marketDate: Date, marketTimezone: string) => string
    formatDecimalTime: (decimalTime: number) => string
}) {
    const { marketId, marketName, open, nextCloseDate, nextOpenDate, timezone, closeHour, openHour, closeReason, hasLogo } = hour;

    return (
        <div>
            <div className="mb-4 flex w-full flex-col items-center justify-center gap-2 lg:flex-row">
                <div className="flex w-full flex-row items-center justify-center gap-2 lg:w-auto">
                    {hasLogo && (
                        <img
                            src={`/logo/${marketId}.png`}
                            alt={hour.marketName}
                            className="rounded-full w-10 h-10"
                            loading="lazy"
                            width="40"
                            height="40"
                        />
                    )}
                    <h3 className="truncate font-semibold text-lg">{marketName}</h3>
                </div>
                <Badge
                    // variant={open ? "outline" : "destructive"} 
                    // className="font-medium text-xs"
                    className={cn("font-medium text-xs", {
                        "bg-red-500 font-bold text-white hover:bg-red-500": !open,
                        "bg-green-500 font-bold text-white hover:bg-green-500": open
                    })}
                >
                    {open ? t("open") : t("closed")}
                </Badge>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                        {open
                            ? `${t("closingAt")} ${getOpeningTimeInUserLocal(nextCloseDate, timezone)}`
                            : `${t("openingAt")} ${getOpeningTimeInUserLocal(nextOpenDate, timezone)}`}
                    </span>
                </div>
                <div className="flex items-center justify-center">
                    <span className="font-bold text-2xl">{formatDistance(open ? nextCloseDate : nextOpenDate, timezone)}</span>
                    {/* <ArrowRightIcon className="w-5 h-5 text-muted-foreground" /> */}
                </div>
                <p className="text-center text-muted-foreground text-xs">
                    {open
                        ? `${formatDecimalTime(closeHour)}${t("hourIndicator")} ${t("localTime")}`
                        : `${formatDecimalTime(openHour)}${t("hourIndicator")} ${t("localTime")}`}
                </p>
            </div>

            {!open && closeReason !== "close" && <p className="mt-2 text-center text-muted-foreground text-sm">{closeReason}</p>}
        </div>
    )
})

// const OpenIndicator = memo(function OpenIndicator() {
//     return (
//         <div className="relative">
//             <div className="size-2 rounded-full bg-green-500" />
//             <div className="absolute top-0 size-2 animate-ping rounded-full bg-green-600 duration-1000" />
//         </div>
//     )
// })

// const CloseIndicator = memo(function CloseIndicator() {
//     return (
//         <div className="relative">
//             <div className="size-2 rounded-full bg-red-500" />
//             <div className="absolute top-0 size-2 animate-ping rounded-full bg-red-600 duration-1000" />
//         </div>
//     )
// })