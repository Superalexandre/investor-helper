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
		preferences = sessionPreferences
	}

	// const uniquePreferences = ensureUniquePositions(preferences)

	return preferences
}

/*
function mergePreferences(
	defaultPreferences: HomePreferences[],
	userPreferences: HomePreferences[]
): HomePreferences[] {
	// Créer une map des préférences par ID pour faciliter la fusion
	const defaultMap = new Map(defaultPreferences.map((pref) => [pref.id, pref]))

	// Itérer sur les préférences utilisateur pour fusionner les données
	for (const userPref of userPreferences) {
		if (defaultMap.has(userPref.id)) {
			// Mettre à jour les propriétés existantes avec celles de l'utilisateur
			const existingPref = defaultMap.get(userPref.id)
			if (existingPref) {
				defaultMap.set(userPref.id, { ...existingPref, ...userPref })
			}
		} else {
			// Ajouter les nouvelles préférences
			defaultMap.set(userPref.id, userPref)
		}
	}

	// Retourner les préférences sous forme d'un tableau
	return Array.from(defaultMap.values())
}
*/
/*
function ensureUniquePositions(preferences: HomePreferences[]) {
	// Utiliser un Map pour détecter les doublons
	const positionMap = new Map()

	// Itérer sur les préférences pour vérifier les positions
	for (const pref of preferences) {
		if (positionMap.has(pref.position)) {
			positionMap.get(pref.position).push(pref)
		} else {
			positionMap.set(pref.position, [pref])
		}
	}

	// Si des positions sont en doublon, on les corrige
	let nextFreePosition = 0
	for (const items of positionMap.values()) {
		if (items.length > 1) {
			// Garder un élément à sa position actuelle, réassigner les autres
			items.sort((a: HomePreferences, b: HomePreferences) => a.id.localeCompare(b.id)) // Trier pour une consistance
			for (let index = 0; index < items.length; index++) {
				const item = items[index]
				if (index === 0) {
					// Garder le premier élément à sa position actuelle
					continue
				}

				// Trouver la prochaine position libre
				while (positionMap.has(nextFreePosition)) {
					nextFreePosition++
				}

				// Réassigner une position unique
				item.position = nextFreePosition
				positionMap.set(nextFreePosition, [item])
				nextFreePosition++
			}
		}
	}

	// Retourner les préférences triées par position
	return preferences.sort((a, b) => a.position - b.position)
}
*/

async function getHomePreferencesFromSession(request: Request, key = "homePreferences") {
	const session = await getSession(request)
	const homePreferences = session.get(key)
	return homePreferences
}

export default getHomePreferences
export { getHomePreferences }
