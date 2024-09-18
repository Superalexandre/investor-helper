// import MillionLint from "@million/lint"
import { vitePlugin as remix } from "@remix-run/dev"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { flatRoutes } from "remix-flat-routes"
import react from "@vitejs/plugin-react"
import { remixPWA } from "@remix-pwa/dev"

const isProduction = process.env.NODE_ENV === "production"

const _plugins = [
    isProduction && react(),
    // react(),
    remix({
        routes: defineRoutes => {
            return flatRoutes("routes", defineRoutes)
        },
        //   tailwind: true,
        //   postcss: true,
        future: {
            // eslint-disable-next-line camelcase
            v3_fetcherPersist: true,
            // eslint-disable-next-line camelcase
            v3_relativeSplatPath: true,
            // eslint-disable-next-line camelcase
            v3_throwAbortReason: true
        }
    }), 
    remixPWA(), 
    tsconfigPaths()
]

// if (!isProduction) _plugins.push(MillionLint.vite({
//     dev: true,
//     // rsc: true,
//     // dev: true,
//     // framework: "react"
// }))

export default defineConfig({
    server: {
        port: 4000
    },
    ssr: {
        noExternal: ["react-charts", "remix-utils"]
    },
    plugins: _plugins
})