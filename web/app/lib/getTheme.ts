import { getSession, getUser } from "../session.server"
import { getUserPreferences } from "./userPreferences"

async function getTheme(request: Request) {
	let hasChanged = false
	let theme = "dark"

	const themeUrl = getThemeFromUrl(request.url)
	if (!hasChanged && themeUrl) {
		theme = themeUrl
		hasChanged = true
	}

	const userTheme = await getThemeFromUser(request)
	if (!hasChanged && userTheme) {
		theme = userTheme
		hasChanged = true
	}

	const sessionTheme = await getThemeFromSession(request)
	if (!hasChanged && sessionTheme) {
		theme = sessionTheme
		hasChanged = true
	}

	const cookies = request.headers.get("Cookie")
	const themeCookie = getThemeFromCookies(cookies)
	if (!hasChanged && themeCookie) {
		theme = themeCookie
		hasChanged = true
	}

	const themeHeader = getThemeFromHeaders(request.headers)
	if (!hasChanged && themeHeader) {
		theme = themeHeader
		hasChanged = true
	}

	return theme
}

function getThemeFromUrl(url: string, key = "theme") {
	const parsedUrl = new URL(url)
	const theme = parsedUrl.searchParams.get(key)
	return theme
}

function getThemeFromCookies(cookies: string | null, key = "theme") {
	if (!cookies) {
		return null
	}

	const splitCookies = cookies.split(";").map((cookie) => cookie.split("="))
	const parsedCookies = Object.fromEntries(splitCookies)
	const theme = parsedCookies[key]
	return theme
}

async function getThemeFromSession(request: Request, key = "theme") {
	const session = await getSession(request)
	const theme = session.get(key)
	return theme
}

async function getThemeFromUser(request: Request) {
	const user = await getUser(request)

	if (!user) {
		return null
	}

	const preferences = await getUserPreferences({ user })

	if (!preferences) {
		return null
	}

	const theme = preferences.theme

	return theme
}

function getThemeFromHeaders(headers: Headers) {
	const headersObject = Object.fromEntries(headers.entries())
	const theme = headersObject.theme
	return theme
}

export { getTheme }
