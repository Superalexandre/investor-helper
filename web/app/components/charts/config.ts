import type { LineProps, XAxisProps, YAxisProps } from "recharts"

const LineConfig: LineProps = {
    strokeWidth: 2,
    dot: false,
}

const YAxisConfig: YAxisProps = {
    tickLine: false,
    axisLine: false,
    scale: "auto",
    domain: [
        (dataMin: number) => Math.floor(dataMin * 0.85),
        (dataMax: number) => Math.ceil(dataMax * 1.05)
    ],
    tickMargin: 0,
    fontSize: 12
}

const XAxisConfig: XAxisProps = {
	tickLine: false,
	axisLine: false,
	tickMargin: 8,
	scale: "auto"
}

export { LineConfig, XAxisConfig, YAxisConfig }
