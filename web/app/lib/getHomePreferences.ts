import { getSession } from "../session.server"
import type HomePreferences from "../../types/Preferences"

async function getHomePreferences(request: Request) {
	let hasChanged = false
	let preferences: HomePreferences[] = [
		{
			id: "marketHours",
			title: "Market Hours",
			position: 0,
			visible: true
		},
		{
			id: "bestLosers",
			title: "Best Losers",
			position: 1,
			visible: true
		},
		{
			id: "bestGainers",
			title: "Best Gainers",
			position: 2,
			visible: true
		},
		{
			id: "news",
			title: "News",
			position: 3,
			visible: true
		},
		{
			id: "events",
			title: "Events",
			position: 4,
			visible: true
		}
	]

	const sessionPreferences = await getHomePreferencesFromSession(request)
	if (!hasChanged && sessionPreferences) {
		hasChanged = true
		preferences = {
			...preferences,
			...sessionPreferences
		}
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
