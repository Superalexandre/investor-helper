import { enUS, fr, type Locale } from "date-fns/locale"

import countriesFr from "../../lang/countries-fr.js"
import countriesEn from "../../lang/countries-en.js"

export default {
	supportedLngs: ["fr-FR", "en-US"],
	fallbackLng: "fr-FR",
	// biome-ignore lint/style/useNamingConvention: <explanation>
	defaultNS: "common",
	interpolation: {
		escapeValue: false
	}
}

export const dateFns: Record<string, Locale> = {
	"fr-FR": fr,
	"en-US": enUS
}

export const countries: Record<string, Record<string, string>> = {
	"fr-FR": countriesFr,
	"en-US": countriesEn
}

export const newsUrl: Record<string, { news: string; originLocale: string }> = {
	"fr-FR": {
		news: "https://fr.tradingview.com/news/markets",
		originLocale: "https://fr.tradingview.com"
	},
	"en-US": {
		news: "https://www.tradingview.com/news/markets",
		originLocale: "https://tradingview.com"
	}
}

export const flags: Record<string, string> = {
	"fr-FR": "/flags/fr.svg",
	"en-US": "/flags/us.svg"
}
