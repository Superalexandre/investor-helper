import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

export default function SkeletonNews() {
	const random = 10
	const badgeArray = Array.from({ length: random })

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Skeleton className="h-4 w-1/4" />
				</CardTitle>
			</CardHeader>

			<CardContent>
				<div className="flex flex-row flex-wrap items-center gap-1.5">
					{badgeArray.map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<Skeleton className="h-8 w-24 rounded-md" key={index} />
					))}
				</div>
			</CardContent>

			<CardFooter className="flex flex-col items-center justify-start gap-1 lg:flex-row lg:gap-2">
				<Skeleton className="h-4 w-1/2" />
			</CardFooter>
		</Card>
	)
}
