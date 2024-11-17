import { enUS, fr, type Locale } from "date-fns/locale"

import countriesFr from "../../lang/countries-fr"
import countriesEn from "../../lang/countries-en"

export default {
	supportedLngs: ["fr-FR", "en-US"],
	fallbackLng: "fr-FR",
	// biome-ignore lint/style/useNamingConvention: <explanation>
	defaultNS: "common",
    interpolation: {
        escapeValue: false,
    },
}

export const dateFns: Record<string, Locale> = {
	"fr-FR": fr,
	"en-US": enUS
}

export const countries: Record<string, Record<string, string>> = {
	"fr-FR": countriesFr,
	"en-US": countriesEn
}