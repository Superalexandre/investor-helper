interface EventRaw {
	[key: string]: string | number | null
	id: string
	title: string
	country: string
	indicator: string
	category: string | null
	period: string
	referenceDate: null | string
	source: string
	// biome-ignore lint/style/useNamingConvention: API response
	source_url: string
	actual: null | number
	previous: null | number
	forecast: null | number
	actualRaw: null | number
	previousRaw: null | number
	forecastRaw: null | number
	currency: string
	importance: number
	date: string
	ticker: string | null
	comment: string | null
	unit: string | null
	scale: string | null
}

export type { EventRaw }
