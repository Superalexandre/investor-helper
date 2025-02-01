type MarketLunchBreak = {
	start: number // Heure locale du début de la pause (en heures décimales)
	end: number // Heure locale de la fin de la pause (en heures décimales)
}

type MarketHours = {
	id: string // Identifiant unique du marché
	name: string // Nom complet du marché
	open: number // Heure d'ouverture (en heures décimales UTC)
	close: number // Heure de fermeture (en heures décimales UTC)
	lunch?: MarketLunchBreak // Pause déjeuner optionnelle
	timezone: string // Fuseau horaire (compatible avec date-fns-tz)
	days: number[] // Jours d'ouverture (lundi = 1, dimanche = 0)
	hasLogo: boolean
}

type MarketsHours = Record<string, MarketHours> // Collection de tous les marchés
type MarketHolidays = Record<string, string[]> // Collection où chaque marché a une liste de dates fériées (au format YYYY-MM-DD)

type MarketStatus = {
	marketId: string
	marketName: string
	open: boolean // Indique si le marché est actuellement ouvert
	closeReason: "holiday" | "weekend" | "lunch" | "close" 
	openHour: number
	closeHour: number
	nextOpenDate: Date
	nextCloseDate: Date
	hasLogo: boolean
	timezone: string
}

export type { MarketHours, MarketsHours, MarketHolidays, MarketStatus }