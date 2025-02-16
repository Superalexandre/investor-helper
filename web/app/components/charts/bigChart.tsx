import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import { cn } from "../../lib/utils";
import { ChartContainer } from "../ui/chart";
import { CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import { XAxisConfig, YAxisConfig } from "./config";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import { isMobile } from 'react-device-detect';

interface SelectedPeriod {
    isActive: boolean,
    startTime: number,
    startPrice: number,
    endTime: number,
    endPrice: number,
    change: number
}

interface LineProps {
    dataKey: string
    stroke: string
    label?: string

    softHide?: boolean

    absoluteStrokeColor?: string

    displayLegend?: boolean
    textLegend?: string
    onClickLegend?: () => void

    displayTooltip?: boolean
    textTooltip?: string
    tooltipFormatter?: (value: number) => string
}

interface ChartProps {
    currency?: string
    lang?: string
    selectedPeriod?: SelectedPeriod
    setSelectedPeriod?: Dispatch<SetStateAction<SelectedPeriod>>

    lines: LineProps[]

    xAxis: string | {
        dataKey: string
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        tickFormatter?: (value: any) => string
        tooltipFormatter?: (value: number) => string
    }
    yAxis: string | {
        dataKey: string | undefined,
        width: number
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    data: any[]
}

const dateConfig: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric"
}

export function Chart({
    currency,
    lang = "fr-FR",
    selectedPeriod,
    setSelectedPeriod,

    lines,
    xAxis,
    yAxis,
    data,
}: ChartProps): ReactNode {
    return (
        <ChartContainer
            config={{}}
            className="min-h-[400px] w-full overflow-hidden lg:h-[500px] lg:min-h-0"
            onMouseDown={(e): void => e.preventDefault()}
        >
            <ComposedChart
                data={data}
                accessibilityLayer={true}
                margin={{ top: 0, left: 0, right: 0, bottom: 0 }}


                onMouseDown={(e): void => {
                    // Get the date of the click
                    const activePayload = e?.activePayload?.[0]

                    if (!activePayload || setSelectedPeriod === undefined || isMobile) {
                        return
                    }

                    setSelectedPeriod({
                        isActive: true,
                        startTime: activePayload.payload.time,
                        startPrice: activePayload.payload.close,
                        endTime: activePayload.payload.time,
                        endPrice: activePayload.payload.close,
                        change: 0
                    })
                }}

                onMouseMove={(e): void => {
                    if (!selectedPeriod?.isActive || setSelectedPeriod === undefined || isMobile) {
                        return
                    }

                    // Get the date of the click
                    const activePayload = e?.activePayload?.[0]

                    if (!activePayload) {
                        return
                    }

                    if (activePayload.payload.time === selectedPeriod.startTime) {
                        return
                    }

                    if (activePayload.payload.time < selectedPeriod.startTime) {
                        setSelectedPeriod((prev) => ({
                            ...prev,
                            isActive: false
                        }))
                    }

                    setSelectedPeriod((prev) => ({
                        ...prev,
                        endTime: activePayload.payload.time,
                        endPrice: activePayload.payload.close,
                        change: ((activePayload.payload.close - prev.startPrice) * 100) / prev.startPrice
                    }))
                }}

                onMouseUp={(): void => {
                    if (setSelectedPeriod === undefined || isMobile) {
                        return
                    }

                    setSelectedPeriod((prev) => ({
                        ...prev,
                        isActive: false
                    }))
                }}

                onMouseLeave={(): void => {
                    if (setSelectedPeriod === undefined || isMobile) {
                        return
                    }

                    setSelectedPeriod((prev) => ({
                        ...prev,
                        isActive: false
                    }))
                }}
            >
                <CartesianGrid vertical={false} />

                <XAxis
                    {...XAxisConfig}

                    dataKey={typeof xAxis === "string" ? xAxis : xAxis.dataKey}
                    tickFormatter={typeof xAxis === "string" ? undefined : xAxis.tickFormatter}
                />

                <YAxis
                    {...YAxisConfig}

                    dataKey={typeof yAxis === "string" ? yAxis : yAxis.dataKey}
                    width={typeof yAxis === "string" ? undefined : yAxis.width}
                />

                {lines.map((line) => (
                    <Line
                        key={line.dataKey}

                        strokeWidth={2}
                        dot={false}

                        {...line}
                        hide={line.softHide}
                    />
                ))}

                <Legend
                    content={(): ReactNode => {
                        return (
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground">
                                    {lines.filter((line) => line.displayLegend).map((line) => (
                                        <button
                                            type="button"
                                            key={line.dataKey} 
                                            className={cn("flex cursor-default items-center gap-1.5", {
                                                "hover:cursor-pointer": Boolean(line.onClickLegend),
                                                "opacity-50": line.softHide
                                            })}
                                            onClick={() => {
                                                console.log("click")

                                                if (line.onClickLegend) {
                                                    return line.onClickLegend()
                                                }
                                                // return line.onClickLegend()
                                            }}
                                        >
                                            <div
                                                // key={line.dataKey}
                                                className="h-3 w-3 shrink-0 rounded-[2px]"
                                                style={{ backgroundColor: line.absoluteStrokeColor || line.stroke }}
                                            />

                                            <span>
                                                {line.textLegend || line.label || line.dataKey}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    }}
                >
                </Legend>

                <Tooltip
                    content={({ payload }): ReactNode => {
                        // console.log(payload)
                        const content = payload?.[0]?.payload

                        if (!content) {
                            return null
                        }

                        const xDataKey = typeof xAxis === "string" ? xAxis : xAxis.dataKey
                        const formatterTitle = typeof xAxis === "string" ? undefined : xAxis.tooltipFormatter

                        return (
                            <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                                <p className="font-bold">
                                    {formatterTitle ? formatterTitle(content[xDataKey]) : content[xDataKey]}
                                </p>

                                <div className="grid gap-1.5">
                                    <div className="flex w-full flex-wrap items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground">
                                        {lines.filter((line) => line.displayTooltip).map((line) => {
                                            const formatter = line.tooltipFormatter || new Intl.NumberFormat(lang).format

                                            return (
                                                <div key={line.dataKey} className="flex w-full flex-row items-center justify-between">
                                                    <div className="flex flex-1 flex-row items-center gap-2 leading-none">
                                                        <div
                                                            className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                                                            style={{
                                                                "--color-bg": line.absoluteStrokeColor || line.stroke,
                                                                "--color-border": line.absoluteStrokeColor || line.stroke,
                                                            } as CSSProperties}
                                                        />

                                                        <p className="text-muted-foreground">{line.textTooltip || line.label || line.dataKey}</p>
                                                    </div>

                                                    <p className="font-bold">{formatter(content[line.dataKey])}</p> 
                                                    {/* <p className="font-bold">{line.absoluteStrokeColor ? content[line.dataKey] : new Intl.NumberFormat(lang).format(content[line.dataKey])}</p> */}
                                                </div>
                                            )
                                        })}

                                    </div>
                                </div>

                                {selectedPeriod?.isActive ? (
                                    <SelectedPeriodInfo {...selectedPeriod} lang={lang} />
                                ) : null}
                            </div>
                        )
                    }}

                />
            </ComposedChart>
        </ChartContainer>
    )
}

interface SelectedPeriodInfoProps extends SelectedPeriod {
    lang: string

}

function SelectedPeriodInfo({
    // isActive,
    change,
    // endPrice,
    endTime,
    // startPrice,
    startTime,
    lang
}: SelectedPeriodInfoProps): ReactNode {

    const fromPrettyDate = new Date(startTime * 1000).toLocaleString(lang, dateConfig)
    const toPrettyDate = new Date(endTime * 1000).toLocaleString(lang, dateConfig)

    const prettyTimeDiff = formatDistance(endTime * 1000, startTime * 1000, {
        includeSeconds: true,
        addSuffix: false,
        locale: fr
    })

    const prettyChange = new Intl.NumberFormat(lang, {
        style: "percent",
        minimumFractionDigits: 2
    }).format(change / 100)

    return (

        <div className="mt-1.5 grid gap-1.5">
            <div className="flex flex-row gap-1.5">
                <p className="font-bold">Du :</p>
                <p>{fromPrettyDate}</p>
            </div>
            <div className="flex flex-row gap-1.5">
                <p className="font-bold">Au :</p>
                <p>{toPrettyDate}</p>
            </div>
            <div className="flex flex-row gap-1.5">
                <p className="font-bold">Changement :</p>
                <div className="flex flex-row items-center gap-1">
                    <p className={cn({
                        "text-green-500": change > 0,
                        "text-red-500": change < 0,
                        "text-muted-foreground": change === 0
                    })}>
                        {change > 0 ? "+" : ""}{prettyChange}
                    </p>
                    <p>({prettyTimeDiff})</p>
                </div>
            </div>
        </div>
    )

}