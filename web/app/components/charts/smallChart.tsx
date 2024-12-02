import type { Period } from "../../../utils/getPrices"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

export const SmallChart = function SmallChart({
	prices
}: {
	prices: Period[]
}) {
	const chartConfig: ChartConfig = {
		close: {
			label: "Prix",
			color: "hsl(var(--chart-1))"
		},
		time: {
			label: "Date"
		}
	}

	return (
		<ChartContainer config={chartConfig} className="w-full overflow-hidden lg:min-h-0">
			<ComposedChart data={prices} accessibilityLayer={true}>
				<CartesianGrid vertical={false} />

				<XAxis
					hide={true}
					dataKey="time"
					tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleString("fr-FR")}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					scale="auto"
				/>

				<YAxis
					hide={true}
					dataKey="close"
					yAxisId="close"
					tickLine={false}
					axisLine={false}
					scale="auto"
					domain={[
						(dataMin: number) => Math.floor(dataMin * 0.8),
						(dataMax: number) => Math.ceil(dataMax * 1.2)
					]}
				/>

				<Line
					yAxisId="close"
					dataKey="close"
					stroke="var(--color-close)"
					strokeWidth={2}
					dot={false}
					className="z-10"
					isAnimationActive={false}
				/>

				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							indicator="dot"
							labelFormatter={(_value, dataLabel) => {
								return new Date(dataLabel[0].payload.time * 1000).toLocaleString("fr-FR", {
									weekday: "long",
									day: "numeric",
									month: "short",
									year: "numeric",
									hour: "numeric",
									minute: "numeric"
								})
							}}
						/>
					}
				/>
			</ComposedChart>
		</ChartContainer>
	)
}
