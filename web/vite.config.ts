import MillionLint from "@million/lint"
import { vitePlugin as remix } from "@remix-run/dev"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { flatRoutes } from "remix-flat-routes"
import react from "@vitejs/plugin-react"
import { remixPWA } from "@remix-pwa/dev"
import mdx from "@mdx-js/rollup"

const isProduction = process.env.NODE_ENV === "production"

const _plugins = [
	mdx(),
	isProduction && react(),
	// react(),
	remix({
		routes: (defineRoutes) => {
			return flatRoutes("routes", defineRoutes)
		},
		//   tailwind: true,
		//   postcss: true,
		future: {
			// biome-ignore lint/style/useNamingConvention: This is a valid option.
			v3_fetcherPersist: true,
			// biome-ignore lint/style/useNamingConvention: This is a valid option.
			v3_relativeSplatPath: true,
			// biome-ignore lint/style/useNamingConvention: This is a valid option.
			v3_throwAbortReason: true
		}
	}),
	remixPWA(),
	tsconfigPaths()
]

// if (!isProduction) {
// 	_plugins.push(
// 		MillionLint.vite({
// 			react: "18",
// 			rsc: true,
// 		})
// 	)
// }

export default defineConfig({
	server: {
		port: 4000
	},
	ssr: {
		noExternal: ["react-charts", "remix-utils"]
	},
	assetsInclude: ["**/*.md"],
	plugins: _plugins
})
