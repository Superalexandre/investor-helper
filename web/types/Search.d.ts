interface RawSearchResult {
	symbol: string
	description: string
	type: string
	exchange: string
	logoid: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	provider_id: string
	source2: {
		id: string
		name: string
		description: string
	}
	// biome-ignore lint/style/useNamingConvention: <explanation>
	source_id: string
	country: string
	typespecs: string[]
}

export type { RawSearchResult }
