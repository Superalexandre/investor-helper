import { useQuery } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { ChartSplineIcon } from "lucide-react"
import { memo, type ReactNode } from "react"
import { Card, CardContent, CardTitle } from "../../components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import { Link } from "@remix-run/react"
import SymbolLogo from "../../components/symbolLogo"
import { Badge } from "../../components/ui/badge"
import { TriangleUpIcon } from "@radix-ui/react-icons"
import { cn } from "../../lib/utils"
import { SmallChart } from "../../components/charts/smallChart"
import type { BestGainer } from "../../../types/Prices"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../components/ui/carousel"

export default function Index({
    t
}: {
    t: TFunction
}): ReactNode {
    return (
        <>
            <h2 className="flex flex-row items-center gap-2 font-bold text-lg">
                <ChartSplineIcon />

                {t("bestGainers")}
            </h2>

            <DisplayBestGainers t={t} />
            {/* <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
            </div> */}
        </>
    )
}


const DisplayBestGainers = memo(function DisplayBestGainers({
    t
}: {
    t: TFunction
}) {
    const {
        data: gainers,
        isPending,
        error
    } = useQuery<{
        result: BestGainer[]
    }>({
        queryKey: ["bestGainers"],
        queryFn: async () => {
            const req = await fetch("/api/prices/bestGainers")
            const json = await req.json()

            return json
        },
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
        <Carousel>
            <CarouselContent>
                {new Array(10).fill(null).map((_, index) => (
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
                ))}
            </CarouselContent>

            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    }

    if (!gainers || gainers.result.length <= 0) {
        return <p>{t("errors.emptyGainers")}</p>
    }

    return (
        // "w-full max-w-[75%] lg:max-w-[90%]"
        <Carousel className="h-80 w-full max-w-[75%] lg:max-w-[90%]">
            <CarouselContent className="-ml-0">
                {gainers.result.map((gainer) => (
                    // className="basis-1/3 md:basis-1/4 lg:basis-1/5 pl-0"
                    <CarouselItem key={gainer.name} className="flex basis-full items-center justify-center p-0 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4">
                        <Link to={`/data/${gainer.symbol}`}>
                            <Card className="relative size-80 whitespace-normal border-card-border">
                                <CardTitle className="flex flex-row items-center justify-center gap-2 p-4 text-center">
                                    <SymbolLogo symbol={gainer} className="size-6 rounded-full" alt={gainer.description} />

                                    {gainer.description}
                                </CardTitle>
                                <CardContent className="flex flex-col items-center justify-center gap-4 p-4">
                                    <div className="flex flex-col items-center justify-center">

                                        <div className="flex flex-row items-center gap-2">
                                            <p>
                                                {gainer.close}
                                                {gainer.currency}
                                            </p>
                                            <Badge className="flex flex-row items-center justify-center bg-green-500 font-bold text-white hover:bg-green-500">
                                                <TriangleUpIcon className="size-5" />
                                                <span>{Number(gainer.rawChange).toFixed(2)}%</span>
                                            </Badge>
                                        </div>
                                        {gainer.recommendation_mark ?
                                            <p className={cn(recommendationColor(gainer.recommendation_mark))}>{recommendation(gainer.recommendation_mark)}</p>
                                            : null}
                                    </div>

                                    <SmallChart prices={gainer.prices} />
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