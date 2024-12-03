import type { columns } from "../app/routes/api/prices/parameters"
import type { Period } from "../utils/getPrices"

type BestGainer = Record<typeof columns[number], unknown> & {
	prices: Period[]
}

type BestLoser = Record<typeof columns[number], unknown> & {
	prices: Period[]
}

export type { BestGainer, BestLoser }
