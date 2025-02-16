import type { TFunction } from "i18next";
import { ChartSplineIcon } from "lucide-react";
import { memo, type ReactNode } from "react";
import type { BestGainer } from "../../../types/Prices";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Link } from "@remix-run/react";
import SymbolLogo from "../../components/symbolLogo";
import { TriangleDownIcon } from "@radix-ui/react-icons";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { SmallChart } from "../../components/charts/smallChart"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../components/ui/carousel";

export default function Index({
    t
}: {
    t: TFunction
}): ReactNode {
    return (

        <>
            <h2 className="mb-4 flex flex-row items-center gap-2 font-bold text-lg">
                <ChartSplineIcon />

                {t("bestLosers")}
            </h2>

            {/* <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2"> */}
            <DisplayBestLosers t={t} />
            {/* </div> */}
        </>
    )
}

const DisplayBestLosers = memo(function DisplayBestLosers({
    t
}: {
    t: TFunction
}) {
    const {
        data: losers,
        isPending,
        error
    } = useQuery<{
        result: BestGainer[]
    }>({
        queryKey: ["bestLosers"],
        queryFn: async () => await fetch("/api/prices/bestLosers").then((res) => res.json()),
        refetchOnWindowFocus: true
    })

    type RecommendationArray = Array<{
        min: number
        max: number
        recommendation: string
        color: string
    }>
    const recommendationMap: RecommendationArray = [
        {
            min: 0,
            max: 1,
            recommendation: t("recommendations.strongBuy"),
            color: "text-green-600"
        }, {
            min: 1,
            max: 2,
            recommendation: t("recommendations.buy"),
            color: "text-green-500"
        }, {
            min: 2,
            max: 3,
            recommendation: t("recommendations.hold"),
            color: "text-gray-500"
        }, {
            min: 3,
            max: 4,
            recommendation: t("recommendations.sell"),
            color: "text-red-500"
        }, {
            min: 4,
            max: 5,
            recommendation: t("recommendations.strongSell"),
            color: "text-red-600"
        }
    ]
    const recommendation = (value: number): string => {
        const rec = recommendationMap.find((rec) => value >= rec.min && value < rec.max)
        return rec ? rec.recommendation : "Unknown"
    }

    const recommendationColor = (value: number): string => {
        const rec = recommendationMap.find((rec) => value >= rec.min && value < rec.max)
        return rec ? rec.color : "text-gray-500"
    }

    if (error) {
        return <p>{t("errors.loading")}</p>
    }

    if (isPending) {
        return (
            <Carousel  className="h-full w-full max-w-[75%] lg:max-w-[90%]">
                <CarouselContent className="-ml-0 h-full">
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
        );
    }

    if (!losers || losers.result.length <= 0) {
        return <p>{t("errors.emptyGainers")}</p>;
    }

    return (
        <Carousel className="h-full w-full max-w-[75%] lg:max-w-[90%]">
            <CarouselContent className="-ml-0 h-full">
                {losers.result.map((loser) => (
                    <CarouselItem key={loser.name} className="flex h-full basis-full items-center justify-center p-0 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4">
                        <Link to={`/data/${loser.symbol}`} className="size-full h-full sm:size-80">
                            <Card className="relative size-full h-full whitespace-normal border-card-border sm:size-80">
                                <CardHeader>
                                    <CardTitle className="flex flex-row items-center justify-center gap-2 text-center">
                                        <SymbolLogo symbol={loser} className="size-6 rounded-full" alt={loser.description} />
                                        {loser.description}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center justify-center gap-4 p-4">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex flex-row items-center gap-2">
                                            <p>
                                                {loser.close}
                                                {loser.currency}
                                            </p>
                                            <Badge className="flex flex-row items-center bg-red-500 font-bold text-white hover:bg-red-500">
                                                <TriangleDownIcon className="size-5" />
                                                <span>{Number(loser.rawChange).toFixed(2)}%</span>
                                            </Badge>
                                        </div>
                                        {loser.recommendation_mark ? (
                                            <p className={cn(recommendationColor(loser.recommendation_mark))}>
                                                {recommendation(loser.recommendation_mark)}
                                            </p>
                                        ) : null}
                                    </div>
                                    <SmallChart prices={loser.prices} />
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>

            <CarouselPrevious variant="default" />
            <CarouselNext variant="default" />
        </Carousel>
    );
})
