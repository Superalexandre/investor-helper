import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
import i18n from "./i18n"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import Backend from "i18next-http-backend"
import { getInitialNamespaces } from "remix-i18next/client"

async function hydrate(): Promise<void> {
	await i18next
		.use(initReactI18next)
		.use(
			new LanguageDetector(null, {
				lookupLocalStorage: "language",

				order: ["localStorage", "htmlTag", "navigator"],
				caches: ["localStorage"]
			})
		)
		.use(Backend)
		.init({
			...i18n,
			ns: getInitialNamespaces(),
			backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
			detection: {
				excludeCacheFor: ["cimode"],
				order: ["htmlTag"],
				caches: []
			}
		})

	startTransition(() => {
		hydrateRoot(
			document,
			<I18nextProvider i18n={i18next}>
				<StrictMode>
					<HydratedRouter />
				</StrictMode>
			</I18nextProvider>
		)
	})
}

if (window.requestIdleCallback) {
	window.requestIdleCallback(hydrate)
} else {
	// Safari doesn't support requestIdleCallback
	// https://caniuse.com/requestidlecallback
	window.setTimeout(hydrate, 1)
}
