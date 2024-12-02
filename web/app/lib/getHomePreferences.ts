import { getSession } from "../session.server"
import type HomePreferences from "../../types/Preferences"

async function getHomePreferences(request: Request) {
	let hasChanged = false
	let preferences: HomePreferences[] = [
		{
			id: "bestLosers",
			title: "Best Losers",
			position: 0,
			visible: true
		},
		{
			id: "bestGainers",
			title: "Best Gainers",
			position: 1,
			visible: true
		},
		{
			id: "news",
			title: "News",
			position: 2,
			visible: true
		},
		{
			id: "events",
			title: "Events",
			position: 3,
			visible: true
		}
	]

	const sessionPreferences = await getHomePreferencesFromSession(request)
	if (!hasChanged && sessionPreferences) {
		hasChanged = true
		preferences = sessionPreferences
	}

	return preferences
}

async function getHomePreferencesFromSession(request: Request, key = "homePreferences") {
	const session = await getSession(request)
	const homePreferences = session.get(key)
	return homePreferences
}

export default getHomePreferences
export { getHomePreferences }
