import { getSession } from "../session.server"
import type HomePreferences from "../../types/Preferences"

async function getHomePreferences(request: Request) {
    let hasChanged = false
    let preferences: HomePreferences[] = [{
        id: "bestGainers",
        title: "Best Gainers",
        position: 0,
        visible: true
    }, {
        id: "news",
        title: "News",
        position: 1,
        visible: true
    }, {
        id: "events",
        title: "Events",
        position: 2,
        visible: true
    }]


    const sessionPreferences = await getLanguageFromSession(request)
    if (!hasChanged && sessionPreferences) {
        hasChanged = true
        preferences = sessionPreferences
    }


    return preferences
}

async function getLanguageFromSession(request: Request, key = "homePreferences") {
    const session = await getSession(request)
    const homePreferences = session.get(key)
    return homePreferences
}

export default getHomePreferences
export { getHomePreferences }