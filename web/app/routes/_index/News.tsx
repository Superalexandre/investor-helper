import { Link } from "@remix-run/react";
import { Button } from "../../components/ui/button";
import { NewspaperIcon } from "lucide-react";
import type { TFunction } from "i18next";
import { memo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import type { NewsArticle } from "../../../types/News"
import { dateFns } from "../../i18n";
import { formatDistanceToNow } from "date-fns";

export default function News({
    t,
    language
}: {
    t: TFunction,
    language: string
}): ReactNode {
    return (
        <>
            <h2 className="flex flex-row items-center gap-2 font-bold text-lg">
                <NewspaperIcon />

                {t("lastNews")}
            </h2>

            <div className="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-track-muted scrollbar-thumb-slate-900 scrollbar-thin flex max-w-full flex-row items-center justify-start gap-4 overflow-y-auto whitespace-nowrap pb-2">
                <DisplayLastNews t={t} language={language} />
            </div>

            <Link to="/news">
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
        queryFn: async () => {
            const req = await fetch("/api/news/important")
            const json = await req.json()

            return json
        },
        refetchOnWindowFocus: true
    })

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

    if (!lastNews || lastNews?.length <= 0) {
        return <p>{t("errors.emptyNews")}</p>
    }

    return lastNews.map((news) => (
        <Link to={`/news/${news.news.id}`} key={news.news.id}>
            <Card className="relative max-h-80 min-h-80 min-w-80 max-w-80 whitespace-normal border-card-border">
                <CardTitle className="p-4 text-center">{news.news.title}</CardTitle>
                <CardContent className="flex flex-col gap-4 p-4">
                    <p className="h-24 max-h-24 overflow-clip">{news.news_article.shortDescription}</p>

                    <div className="absolute bottom-0 left-0 p-4 text-muted-foreground">
                        <p>
                            {t("by")} {news.news.source}
                        </p>
                        <DisplayDate date={news.news.published} locale={language} />
                    </div>
                </CardContent>
            </Card>
        </Link>
    ))
})
