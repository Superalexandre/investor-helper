import { vitePlugin as remix } from "@remix-run/dev"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { flatRoutes } from "remix-flat-routes"
// import react from "@vitejs/plugin-react"
import { remixPWA } from "@remix-pwa/dev"
// import external from "rollup-plugin-peer-deps-external"
// import { nodePolyfills } from "vite-plugin-node-polyfills"

const isProduction = process.env.NODE_ENV === "production"

console.log("isProduction", isProduction)

export default defineConfig({
    build: {
        // modulePreload: {
        //     polyfill: true
        // },
        rollupOptions: {
            external: ["react", "react-dom", "bcrypt", "crypto"],
        }
    },
    envDir: "../",
    server: {
        port: 4000,
    },
    ssr: {
        noExternal: ["react-charts", "remix-utils"]
    },
    plugins: [
        // react(),
        // nodePolyfills(),
        remix({
            routes: (defineRoutes) => {
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
                v3_throwAbortReason: true,
            },
        }),
        remixPWA({
            // workerBuildDirectory: "out",
            // scope: "/pwa",
        }),
        tsconfigPaths(),
        // external({
        //     includeDependencies: true,
        // }),
    ],
    // external: ["react", "react-dom"],
})
