/// <reference lib="WebWorker" />

// import { PushManager } from "@remix-pwa/push/client"
// import { clearUpOldCaches, DefaultFetchHandler, EnhancedCache, isDocumentRequest, isLoaderRequest, NavigationHandler } from "@remix-pwa/sw"

import { PushManager } from "@remix-pwa/push/client"
// import {
// 	type DefaultFetchHandler,
// 	EnhancedCache,
// 	isDocumentRequest,
// 	isLoaderRequest,
// 	NavigationHandler
// } from "@remix-pwa/sw"

declare let self: ServiceWorkerGlobalScope

// const version = "v1"

// const DOCUMENT_CACHE_NAME = "document-cache"
// const ASSET_CACHE_NAME = "asset-cache"
// const DATA_CACHE_NAME = "data-cache"

// const OFFLINE_CACHE = "offline-cache"
// const OFFLINE_PAGE = "/offline.html"

// const documentCache = new EnhancedCache(DOCUMENT_CACHE_NAME, {
// 	version,
// 	strategy: "CacheFirst",
// 	strategyOptions: {
// 		maxEntries: 64
// 	}
// })

// const assetCache = new EnhancedCache(ASSET_CACHE_NAME, {
// 	version,
// 	strategy: "CacheFirst",
// 	strategyOptions: {
// 		maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
// 		maxEntries: 100
// 	}
// })

// const dataCache = new EnhancedCache(DATA_CACHE_NAME, {
// 	version,
// 	strategy: "NetworkFirst",
// 	strategyOptions: {
// 		networkTimeoutInSeconds: 10,
// 		maxEntries: 72
// 	}
// })

// const messageHandler = new NavigationHandler({
// 	cache: documentCache
// })

self.addEventListener("install", (event) => {
	console.log("Service worker installed")

	// event.waitUntil(
	// 	(async () => {
	// 		const cache = await caches.open(OFFLINE_CACHE)

	// 		await cache.add(new Request(OFFLINE_PAGE, { cache: "reload" }))
	// 	})()
	// )

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

// self.addEventListener("message", (event: ExtendableMessageEvent) => {
// 	event.waitUntil(messageHandler.handleMessage(event))
// })

// self.addEventListener("fetch", (event) => {
// 	if (event.request.mode === "navigate") {
// 		event.respondWith(
// 			(async () => {
// 				try {
// 					const preloadResponse = await event.preloadResponse
// 					if (preloadResponse) {
// 						return preloadResponse
// 					}

// 					const networkResponse = await fetch(event.request)
// 					return networkResponse
// 				} catch (error) {
// 					console.log("Fetch failed; returning offline page instead.", error)

// 					const cache = await caches.open(OFFLINE_CACHE)
// 					const cachedResponse = await cache.match(OFFLINE_PAGE)
// 					return cachedResponse
// 				}
// 			})()
// 		)
// 	}
// })

new PushManager({
	handlePushEvent: async (event) => {
		const data = event.data ? event.data.json() : {}

		console.log("Push event", data)

		const options: NotificationOptions = {
			body: data.options.body || "Nouvelle notification",
			icon: data.options.icon || "/logo-192-192.png",
			badge: data.options.badge || undefined,
			// badge: "/badge.png",
			// tag: data.tag || "notification",
			data: {
				url: data.options.data.url || "/"
			},
			requireInteraction: true
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

// export const defaultFetchHandler: DefaultFetchHandler = async ({ context }) => {
// 	const request = context.event.request
// 	const url = new URL(request.url)

// 	if (isDocumentRequest(request)) {
// 		const result = await documentCache.handleRequest(request)

// 		console.log("Document cache", request.url, result)

// 		if (result.status === 200) {
// 			return result
// 		}

// 		console.log("Document cache miss", request.url)
// 	}

// 	if (isLoaderRequest(request)) {
// 		console.log("Loader request", request.url)

// 		return dataCache.handleRequest(request)
// 	}

// 	if (self.__workerManifest.assets.includes(url.pathname)) {
// 		console.log("Asset request", request.url)

// 		return assetCache.handleRequest(request)
// 	}

// 	console.log("Fetch request", request.url)

// 	try {
// 		return fetch(request)
// 	} catch (error) {
// 		console.error("Fetch error", error)

// 		return offlineResponse()
// 	}
// }

// async function offlineResponse() {
// 	const cache = await caches.open(OFFLINE_CACHE)
// 	const response = await cache.match(OFFLINE_PAGE)

// 	if (response) {
// 		return response
// 	}

// 	return new Response("Offline", { status: 503 })
// }
