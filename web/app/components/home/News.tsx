// import { Link } from "@remix-run/react";
import { Button } from "../../components/ui/button";
import { NewspaperIcon } from "lucide-react";
import type { TFunction } from "i18next";
import { memo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import type { NewsArticle } from "../../../types/News"
import { dateFns } from "../../i18n";
import { formatDistanceToNow } from "date-fns";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../components/ui/carousel";
import { Link } from "@tanstack/react-router";

export default function News({
    t,
    language
}: {
    t: TFunction,
    language: string
}): ReactNode {
    return (
        <>
            <h2 className="mb-4 flex flex-row items-center gap-2 font-bold text-lg">
                <NewspaperIcon />
                {t("lastNews")}
            </h2>

            <DisplayLastNews t={t} language={language} />

            <Link to=".">
                <Button variant="default">{t("seeMore")}</Button>
            </Link>
        </>
    )
}

const DisplayDate = memo(function DisplayDate({ date, locale }: { date: number; locale: string }) {
    const d = new Date(date * 1000)

    const formattedDate = formatDistanceToNow(d, {
        locale: dateFns[locale],
        addSuffix: true
    })

    return <p>{formattedDate}</p>
})

const DisplayLastNews = memo(function DisplayLastNews({
    t,
    language
}: {
    t: TFunction
    language: string
}) {
    const {
        data: lastNews,
        isPending,
        error
    } = useQuery<NewsArticle[]>({
        queryKey: ["importantNews"],
        queryFn: async () => await fetch("/api/news/important").then((res) => res.json()),
        refetchOnWindowFocus: true
    })

    if (error) {
        return <p>{t("errors.loading")}</p>
    }

    if (isPending) {
        return (
            <Carousel className="h-full w-full max-w-[75%] lg:max-w-[90%]">
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
        )
    }

    if (!lastNews || lastNews?.length <= 0) {
        return <p>{t("errors.emptyNews")}</p>
    }

    return (
        <Carousel className="h-full w-full max-w-[75%] lg:max-w-[90%]">
            <CarouselContent className="-ml-0 h-full justify-center">
                {lastNews.map((news) => (
                    <CarouselItem key={news.news.id} className="flex h-full basis-full items-center justify-center p-0 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4">
                        <Link to={`/news/${news.news.id}`} className="size-full h-full sm:size-80">
                            <Card className="relative size-full h-full whitespace-normal border-card-border sm:size-80">
                                <CardHeader>
                                    <CardTitle className="text-center">{news.news.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4 p-4">
                                    <p className="h-24 max-h-24 overflow-clip">{news.news_article.shortDescription}</p>
                                    <div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
                                        <p>{t("by")} {news.news.source}</p>
                                        <DisplayDate date={news.news.published} locale={language} />
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