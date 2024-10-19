import type { WebAppManifest } from "@remix-pwa/dev"
import { json } from "@remix-run/node"

interface Manifest extends WebAppManifest {
	id: string
	// display_override: Array<"fullscreen" | "minimal-ui" | "window-controls-overlay">
	screenshots: Array<{
		src: string
		type?: string
		sizes?: string
		form_factor?: "wide" | "full-screen" | "any"
		label?: string
	}>
}

const webAppManifest: Manifest = {
	short_name: "Investor Helper",
	name: "Investor Helper",
	description: "Investor Helper votre assistant pour investir en bourse",
	dir: "ltr",
	lang: "fr",

	start_url: "/?utm_source=pwa",

	id: "/?utm_source=pwa",
	scope: "/?utm_source=pwa",
	display: "standalone",

	// @ts-expect-error display_override is not in the WebAppManifest type
	display_override: ["minimal-ui", "window-controls-overlay"],

	// background_color: "#d3d7dd",
	background_color: "#030712",
	// theme_color: "#41D3EC",
	theme_color: "#0f172a",

	orientation: "portrait",
	categories: ["finance", "news", "business", "education", "productivity"],
	handle_links: "preferred",

	prefer_related_applications: false,

	launch_handler: {
		client_mode: ["focus-existing", "auto"]
	},

	icons: [
		{
			src: "/maskable/maskable_icon_x192.png",
			sizes: "192x192",
			type: "image/png",
			purpose: "maskable"
		},
		{
			src: "/logo-192-192.webp",
			sizes: "192x192",
			type: "image/webp",
			purpose: "any"
		},
		{
			src: "/logo-512-512.webp",
			sizes: "512x512",
			type: "image/webp",
			purpose: "any"
		},
		{
			src: "/logo-1024-1024.webp",
			sizes: "1024x1024",
			type: "image/webp",
			purpose: "any"
		}, {
			src: "/logo-192-192.png",
			sizes: "192x192",
			type: "image/png",
			purpose: "any"
		},
		{
			src: "/logo-512-512.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "any"
		},
		{
			src: "/logo-1024-1024.png",
			sizes: "1024x1024",
			type: "image/png",
			purpose: "any"
		}
	],
	shortcuts: [
		{
			name: "Investor Helper",
			short_name: "Investor Helper",
			description: "Investor Helper votre assistant pour investir en bourse",
			url: "/?utm_source=pwa",
			icons: [
				{
					src: "/maskable/maskable_icon_x192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "maskable"
				}
			]
		},
		{
			// news
			name: "Actualités",
			short_name: "Actualités",
			description: "Les dernières actualités financières",
			url: "/news?utm_source=pwa",
			icons: [
				{
					src: "/maskable/maskable_icon_x192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "maskable"
				}
			]
		}
	],
	screenshots: [
		{
			src: "/screenshots/wide.png",
			type: "image/png",
			form_factor: "wide",
			sizes: "2536x1419",
			label: "Wide screenshot"
		},
		{
			src: "/screenshots/small.png",
			type: "image/png",
			sizes: "577x1272",
			label: "Small screenshot"
		}
	]
}

export const loader = () => {
	return json(webAppManifest, {
		headers: {
			"Cache-Control": "public, max-age=600",
			"Content-Type": "application/manifest+json"
		}
	})
}
