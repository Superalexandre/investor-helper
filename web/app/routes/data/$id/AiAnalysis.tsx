import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

export default function AiAnalysis({
    symbol
}: {
    symbol: string
}): ReactNode {
    
	const {
		data,
		isPending,
		error,
	} = useQuery({
		queryKey: ["analysis", symbol],
		queryFn: async () => fetch(`/api/data/analysis?symbol=${symbol}`).then((res) => res.json()),
		refetchOnWindowFocus: true
	})

    if (isPending) {
        return (
            <p>Loading...</p>
        )
    }

    if (error || (data?.error)) {
        return (
            <p>Error: {error?.message}</p>
        )
    }

    console.log(data)

    return (
        <div className="flex flex-col gap-4">
            <h1>{data.analysis.recommendation}</h1>
            <p>{data.analysis.fr.beginner.reason}</p>
            <p>{data.analysis.fr.advanced.reason}</p>
            <p>{data.analysis.confidence}/10</p>
        </div>
    )

}