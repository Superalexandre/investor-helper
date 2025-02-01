import logger from "../../../log"
import { getSourceList } from "../../utils/news"
import { getSession } from "../session.server"
import getLanguage from "./getLanguage"

async function getNewsPreferences(request: Request) {
	const language = await getLanguage(request)
	const sources = await getSourceList({
		languages: [language]
	})

	let hasChanged = false
	let preferences = {
		languages: [language],
		importances: ["none", "low", "medium", "high", "very-high"],
		sources: sources
	}

	const sessionPreferences = await getNewsPreferencesFromSession(request)
	if (!hasChanged && sessionPreferences) {
		hasChanged = true
		preferences = {
			...preferences,
			...sessionPreferences
		}

		
	// const sources = await getSourceList({
	// 	languages: newsPreferences.languages
	// })

		logger.info(`Preferences language ${preferences.languages}`)
	}

	return preferences
}

async function getNewsPreferencesFromSession(request: Request, key = "newsPreferences") {
	const session = await getSession(request)
	const newsPreferences = session.get(key)
	return newsPreferences
}

export default getNewsPreferences
export { getNewsPreferences }
