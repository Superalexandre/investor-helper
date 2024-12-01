import { getSession } from "../session.server"
import getLanguage from "./getLanguage"

async function getNewsPreferences(request: Request) {
	const language = await getLanguage(request)

	let hasChanged = false
	let preferences = {
		languages: [language],
		importances: ["none", "low", "medium", "high", "very-high"]
	}

	const sessionPreferences = await getNewsPreferencesFromSession(request)
	if (!hasChanged && sessionPreferences) {
		hasChanged = true
		preferences = {
			...preferences,
			...sessionPreferences
		}
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
