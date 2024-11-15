import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

export default function SkeletonCalendar() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Skeleton className="h-4 w-1/4" />
				</CardTitle>
			</CardHeader>

			<CardContent>
				<Skeleton className="h-32 w-full" />
			</CardContent>

			<CardFooter className="flex flex-col items-center justify-start gap-1 lg:flex-row lg:gap-2">
				<Skeleton className="h-4 w-1/2" />
			</CardFooter>
		</Card>
	)
}
