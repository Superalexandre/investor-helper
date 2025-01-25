import { useState, type ComponentType, type ReactNode } from "react"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart"
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

interface FullConfig {
    [x: string]: {
        label?: ReactNode
        icon?: ComponentType
    } & (
        | {
            color?: string
            theme?: never
        }
        | {
            color?: never
            theme: Record<"light" | "dark", string>
        }
    ) &
    (
        | {
            display?: boolean
            onClick?: () => void
        }
        | {
            display?: never
            onClick?: never
        }
    )
}

const chartConfig: FullConfig = {
    value: {
        label: "Prix",
        color: "hsl(var(--chart-1))"
    },
    netValue: {
        label: "Valeur nette",
        color: "hsl(var(--chart-1))"
    },
    time: {
        label: "Date"
    }
}

export function ChartData({
    allPrices
}: {
    allPrices: {
        date: string
        value: number
        netValue: number
    }[]
}): ReactNode {
    const [displayValue, setDisplayValue] = useState<"value" | "netValue">("netValue")

    return (
        <div className="h-auto w-full">
            <ChartContainer config={chartConfig} className="min-h-[400px] w-full overflow-hidden lg:h-[500px] lg:min-h-0">
                <ComposedChart data={allPrices} accessibilityLayer={true} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} />

                    <XAxis
                        dataKey="date"
                        // tickFormatter={}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        scale="auto"
                    />

                    <YAxis
                        dataKey={displayValue}
                        yAxisId={displayValue}
                        tickLine={false}
                        axisLine={false}
                        scale="auto"
                        domain={displayValue === "value" ? [
                            (dataMin: number) => Math.floor(dataMin * 0.85),
                            (dataMax: number) => Math.ceil(dataMax * 1.05)
                        ] : [
                            (dataMin: number) => Math.floor(dataMin * 1.2),
                            (dataMax: number) => Math.ceil(dataMax * 1.1)
                        ]}
                        tickMargin={0}
                        fontSize={12}
                        width={24}
                    />

                    <Line
                        yAxisId={displayValue}
                        dataKey={displayValue}
                        stroke="var(--color-value)"
                        strokeWidth={2}
                        dot={false}
                        className="z-10"
                    />

                    <ChartLegend
                        content={<ChartLegendContent renderHidden={true} />}
                    />

                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                indicator="dot"
                                labelFormatter={(_value, dataLabel): string => {
                                    console.log(dataLabel[0].payload)

                                    return new Date(dataLabel[0].payload.date).toLocaleString("fr-FR", {
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
        </div>
    )
}