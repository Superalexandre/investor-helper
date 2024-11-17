import { parseAcceptLanguage } from "intl-parse-accept-language"

import i18next from "../i18n"

function getLanguage(request: Request) {
    let hasChanged = false
    let locale = i18next.fallbackLng
    
    const language = getLanguageFromUrl(request.url)
    if (!hasChanged && language) {
        hasChanged = true
        locale = language
    }

    const cookies = request.headers.get("Cookie")
    const languageCookie = getLanguageFromCookies(cookies)
    if (!hasChanged && languageCookie) {
        hasChanged = true
        locale = languageCookie
    }

    const languagesHeader = getLanguageFromHeaders(request.headers)
    if (!hasChanged && languagesHeader && languagesHeader.length > 0 && languagesHeader) {
        hasChanged = true
        locale = languagesHeader
    }

    return "en-US"
}

function getLanguageFromCookies(cookies: string | null, key = "language") {
    if (!cookies) { return null }

    const splitCookies = cookies.split(";").map(cookie => cookie.split("="))
    const parsedCookies = Object.fromEntries(splitCookies)
    const language = parsedCookies[key]
    return language
}

function getLanguageFromUrl(url: string, key = "language") {
    const parsedUrl = new URL(url)
    const language = parsedUrl.searchParams.get(key)
    return language
}

function getLanguageFromHeaders(headers: Headers) {
    const headersObject = Object.fromEntries(headers.entries())
    const headersString = headersObject["accept-language"]
    const languagesHeader = parseAcceptLanguage(headersString) || []
    const closestLanguage = getClosetLanguage(languagesHeader)

    console.log("languages", {
        headersString,
        languagesHeader,
        closestLanguage
    })

    return closestLanguage
}

function getClosetLanguage(languagesHeader: string[]) {
    const supportedLanguages: string[] = i18next.supportedLngs
    
    if (!supportedLanguages || supportedLanguages.length === 0) { return null }

    for (const languageHeader of languagesHeader) {
        for (const supportedLanguage of supportedLanguages) {
            if (languageHeader.startsWith(supportedLanguage)) {
                return supportedLanguage
            }
        }
    }
}

export default getLanguage
export { getLanguage }