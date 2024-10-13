/// <reference lib="WebWorker" />

// import { PushManager } from "@remix-pwa/push/client"
// import { clearUpOldCaches, DefaultFetchHandler, EnhancedCache, isDocumentRequest, isLoaderRequest, NavigationHandler } from "@remix-pwa/sw"

import { PushManager } from "@remix-pwa/push/client"

declare let self: ServiceWorkerGlobalScope

self.addEventListener("install", (event) => {
	console.log("Service worker installed")

	event.waitUntil(self.skipWaiting())

	// event.waitUntil(assetCache.preCacheUrls(
	//     self.__workerManifest.assets.filter(url => !url.endsWith(".map") && !url.endsWith(".js"))
	// ))
})

self.addEventListener("activate", (event) => {
	console.log("Service worker activated")

	event.waitUntil(self.clients.claim())
	// event.waitUntil(Promise.all([
	//     clearUpOldCaches([DOCUMENT_CACHE_NAME, DATA_CACHE_NAME, ASSET_CACHE_NAME], version),
	//     self.clients.claim(),
	// ]))
})

self.addEventListener("pushsubscriptionchange", (event) => {
	console.log("Push subscription change", event)

	fetch("/api/notifications/unsubscribe", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			pushSubscription: self.registration.pushManager.getSubscription()
		})
	})

	// event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => caches.delete(cacheName))))
})

new PushManager({
	handlePushEvent: async (event) => {
		const data = event.data ? event.data.json() : {}

		console.log("Push event", data)

		const options: NotificationOptions = {
			body: data.options.body || "Nouvelle notification",
			icon: data.options.icon || "/logo-192-192.webp",
			badge: data.options.badge || undefined,
			// badge: "/badge.png",
			// tag: data.tag || "notification",
			data: {
				url: data.options.data.url || "/"
			},
			requireInteraction: true,
		}

		const windowClients = await self.clients.matchAll({
			type: "window",
			includeUncontrolled: true
		})
		const windowActiveClients = windowClients.filter((client) => client.focused)

		if (windowActiveClients.length > 0) {
			for (const client of windowActiveClients) {
				if (client.focused) {
					console.log("Client focused", client, client.postMessage)

					client.postMessage({
						type: "notification",
						title: data.title,
						body: data.options.body,
						url: data.options.data.url || "/"
					})
				}
			}
		} else {
			console.log("No active client")

			// Si pas d'onglet actif, envoie une notification native
			// event.waitUntil(self.registration.showNotification(data.title, options))
			self.registration.showNotification(data.title, options)
		}
	},
	handleNotificationClick: (event) => {
		const data = event.notification.data

		console.log("Notification click", data)

		event.waitUntil(self.clients.openWindow(data.url || "/"))
	},
	handleNotificationClose: (event) => {
		console.log("Notification close", event)
	},
	handleNotificationError: (event) => {
		console.log("Notification error", event)
	}
})
