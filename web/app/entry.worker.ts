/// <reference lib="webworker" />

const selfRef = self as unknown as ServiceWorkerGlobalScope

selfRef.addEventListener("install", (event) => {
	console.log("Service worker installed")

	// postMessage
	const promise = new Promise((resolve, reject) => {
		selfRef.skipWaiting().then(() => {
			selfRef.clients
				.matchAll({
					type: "window",
					includeUncontrolled: true
				})
				.then((clients) => {
					for (const client of clients) {
						console.log("Client", client)

						client.postMessage({
							type: "install"
						})
					}

					resolve(true)
				})
		}).catch(reject)
	})

	event.waitUntil(promise)
})

selfRef.addEventListener("activate", (event) => {
	console.log("Service worker activated")

	event.waitUntil(selfRef.clients.claim())
})

selfRef.addEventListener("pushsubscriptionchange", (event) => {
	console.log("Push subscription change", event)

	fetch("/api/notifications/unsubscribe", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			pushSubscription: selfRef.registration.pushManager.getSubscription()
		})
	})

	// event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => caches.delete(cacheName))))
})

selfRef.addEventListener("push", (event) => {

	const data = event.data ? event.data.json() : {}

	console.log("Push event", data)

	const options: NotificationOptions = {
		body: data.options.body || "Nouvelle notification",
		icon: data.options.icon || "/logo-192-192.png",
		badge: data.options.badge || undefined,
		// badge: "/badge.png",
		// tag: data.tag || "notification",
		data: {
			url: data.options?.data?.url || "/"
		},
		// requireInteraction: true,
		silent: false,
		// @ts-ignore
		actions: [
			{ action: "open", title: "Ouvrir" },
			{ action: "dismiss", title: "Ignorer" }
		]
	}

	const promise = new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject("Timeout")
		}, 5000)

		selfRef.clients
			.matchAll({
				type: "window",
				includeUncontrolled: true
			})
			.then((clients) => {
				for (const client of clients) {
					if (client.focused) {
						client.postMessage({
							type: "notification",
							title: data.title,
							body: data.options.body,
							url: data.options.data.url || "/"
						})

						clearTimeout(timeout)
						resolve(true)
					}
				}

				if (clients.length === 0) {
					// event.waitUntil(self.registration.showNotification(data.title, options))
					selfRef.registration.showNotification(data.title, options).then(() => {
						console.log("Notification sent")

						clearTimeout(timeout)
						resolve(true)
					})
				}
			})
	})

	event.waitUntil(promise)
})

selfRef.addEventListener("notificationclick", (event) => {
	console.log("Notification click", event)

	event.notification.close()

	const data = event.notification.data

	// Check if the action is dismiss
	if (event.action === "dismiss") {
		return
	}

	const promise = new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject("Timeout")
		}, 5000)

		selfRef.clients.openWindow(data.url || "/").then((client) => {
			clearTimeout(timeout)

			return resolve(client)
		})
	})

	event.waitUntil(promise)
})

selfRef.addEventListener("notificationclose", (event) => {
	console.log("Notification close", event)
})

selfRef.addEventListener("notificationerror", (event) => {
	console.log("Notification error", event)
})