// import MillionLint from "@million/lint"
import { reactRouter } from "@react-router/dev/vite";
// import ReactComponentName from "react-scan/react-component-name/vite"
// import { vitePlugin as remix } from "@remix-run/dev"

import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import react from "@vitejs/plugin-react"
import { remixPWA } from "@remix-pwa/dev"
import mdx from "@mdx-js/rollup"

const isProduction = process.env.NODE_ENV === "production"

const _plugins = [
	// ReactComponentName({}),
	mdx(),
	isProduction && react(),
	// remix(),
	reactRouter(),
	// react(),
	// reactRouter({
	// 	routes: (defineRoutes) => {
	// 		return flatRoutes("routes", defineRoutes)
	// 	},
	// 	future: {
	// 		// biome-ignore lint/style/useNamingConvention: This is a valid option.
	// 		v3_fetcherPersist: true,
	// 		// biome-ignore lint/style/useNamingConvention: This is a valid option.
	// 		v3_relativeSplatPath: true,
	// 		// biome-ignore lint/style/useNamingConvention: This is a valid option.
	// 		v3_throwAbortReason: true
	// 	}
	// }),
	remixPWA(),
	tsconfigPaths()
]

// if (!isProduction) {
// 	_plugins.push(
// 		MillionLint.vite()
// 	)
// }

export default defineConfig({
	build: {
		cssMinify: process.env.MODE === "production",
		// sourcemap: true
	},
	server: {
		port: 4000
	},
	// ssr: {
	// 	noExternal: [
	// 		"react-charts", 
	// 		"remix-utils"
	// 	]
	// },
	assetsInclude: ["**/*.md"],
	plugins: _plugins
})
