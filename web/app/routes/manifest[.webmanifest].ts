/* eslint-disable camelcase */
import type { WebAppManifest } from "@remix-pwa/dev"
import { json } from "@remix-run/node"

const webAppManifest: WebAppManifest = {
    short_name: "PWA",
    name: "Remix PWA",
    start_url: "/",
    display: "standalone",
    background_color: "#d3d7dd",
    theme_color: "#c34138",
    scope: "/",
    orientation: "portrait",
    categories: ["finance"],
    prefer_related_applications: false,
}

export const loader = () => {
    return json(webAppManifest, {
        headers: {
            "Cache-Control": "public, max-age=600",
            "Content-Type": "application/manifest+json",
        },
    })
}
