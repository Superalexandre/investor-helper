import { parseAcceptLanguage } from "intl-parse-accept-language"
import { parse as cookieParser } from "cookie"

import i18next from "../i18n"
import { getSession } from "../session.server"

async function getLanguage(request: Request) {
    let hasChanged = false
    let locale = i18next.fallbackLng
    
    const language = getLanguageFromUrl(request.url)
    if (!hasChanged && language) {
        hasChanged = true
        locale = language
    }

    const sessionLanguage = await getLanguageFromSession(request)
    if (!hasChanged && sessionLanguage) {
        hasChanged = true
        locale = sessionLanguage
    }

    const cookies = request.headers.get("Cookie")
    const languageCookie = getLanguageFromCookies(cookies)
    if (!hasChanged && languageCookie) {
        hasChanged = true
        locale = languageCookie
    }

    const { headersString, languagesHeader, closestLanguage } = getLanguageFromHeaders(request.headers)
    if (!hasChanged && closestLanguage) {
        hasChanged = true
        locale = closestLanguage
    }

    console.log("languages", {
        sessionLanguage,
        headersString,
        languagesHeader,
        closestLanguage,
        languageUrl: language,
        languageCookie,
        locale,
        hasChanged
    })

    return locale
}

function getLanguageFromCookies(cookies: string | null, key = "language") {
    if (!cookies) { return null }

    const parsedCookies = cookieParser(cookies)
    const language = parsedCookies[key]

    return language
}

async function getLanguageFromSession(request: Request, key = "language") {
    const session = await getSession(request)
    const language = session.get(key)
    return language
}

function getLanguageFromUrl(url: string, key = "language") {
    const parsedUrl = new URL(url)
    const language = parsedUrl.searchParams.get(key)
    return language
}

function getLanguageFromHeaders(headers: Headers, key = "Accept-Language") {
    const headersString = headers.get(key)
    const languagesHeader = parseAcceptLanguage(headersString) || []
    const closestLanguage = getClosetLanguage(languagesHeader)

    return {
        headersString,
        languagesHeader,
        closestLanguage
    }
}

function getClosetLanguage(languagesHeader: string[]) {
    const supportedLanguages: string[] = i18next.supportedLngs
    
    if (!supportedLanguages || supportedLanguages.length === 0) { return null }

    for (const languageHeader of languagesHeader) {
        for (const supportedLanguage of supportedLanguages) {
            if (supportedLanguage.startsWith(languageHeader)) {
                return supportedLanguage
            }
        }
    }
}

export default getLanguage
export { getLanguage }