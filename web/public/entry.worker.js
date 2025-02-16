const CACHE_NAME = "v1";
const OFFLINE_PAGE = "/offline";
const ASSETS_TO_CACHE = [
    // Scripts
    "/register.js",
    "/entry.worker.js",

    // Pages
    "/",
    "/news",
    "/calendar",
    "/profile",

    // Images for the download
    "/screenshots/wide.png",
    "/screenshots/small.png",

    // Images
    "/favicon.ico",
    "/logo-128-128.webp",
    "/logo-192-192.webp",
    "/logo-32-32.webp",

    // Offline page
    OFFLINE_PAGE
];

self.addEventListener("install", (event) => {
    console.log("Service worker installed");

    const promise = new Promise((resolve, reject) => {
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log("Cache opened", cache);

                const cachePromises = ASSETS_TO_CACHE.map((resource) => {
                    return cache
                        .add(resource)
                        .then(() => {
                            console.log(`Cached: ${resource}`);
                        })
                        .catch((err) => {
                            console.error(`Failed to cache ${resource}:`, err);
                        });
                });

                Promise.all(cachePromises).then(() => {
                    self
                        .skipWaiting()
                        .then(() => {
                            self.clients
                                .matchAll({
                                    type: "window",
                                    includeUncontrolled: true
                                })
                                .then((clients) => {
                                    for (const client of clients) {
                                        console.log("Client", client);

                                        client.postMessage({
                                            type: "install"
                                        });
                                    }

                                    resolve(true);
                                });
                        })
                        .catch(reject);
                });
            })
            .catch(reject);
    });

    event.waitUntil(promise);
});

self.addEventListener("activate", (event) => {
    console.log("Service worker activated");

    const deleteOldCaches = caches.keys().then((cacheNames) => {
        return Promise.all(
            cacheNames.map((cacheName) => {
                if (cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                }
            })
        );
    });

    const sendClientsMessage = () =>
        self.clients
            .matchAll({
                type: "window",
                includeUncontrolled: true
            })
            .then((clients) => {
                for (const client of clients) {
                    console.log("Client", client);
                    client.postMessage({
                        type: "activate"
                    });
                }
            });

    const promise = new Promise((resolve, reject) => {
        // Call clients.claim() directly
        self.clients.claim()
            .then(() => deleteOldCaches)
            .then(() => sendClientsMessage())
            .then(() => resolve(true))
            .catch(reject);
    });

    event.waitUntil(promise);
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached asset if found
            if (response && !response.url.includes("/api/")) {	
                console.log("Fetch from cache", {
                    url: event.request.url,
                    method: event.request.method,
                    response
                });

                return response;
            }

            // Fetch from network if not cached
            return fetch(event.request)
                .then((networkResponse) => {
                    // Cache the fetched asset
                    // if (networkResponse.ok) {
                        // const responseClone = networkResponse.clone();

                        // caches.open(CACHE_NAME).then((cache) => {

                        //     const url = event.request.url

                        //     if (url.startsWith("chrome-extension://") || url.startsWith("chrome://")) {
                        //         return;
                        //     }

                        //     if (url.includes("/api/")) {
                        //         return;
                        //     }

                        //     console.log("Cache new asset", {
                        //         url: event.request.url,
                        //         method: event.request.method,
                        //         response: responseClone
                        //     });
                     
                        //     cache.put(event.request, responseClone);
                        // });
                    // }

                    return networkResponse;
                })
                .catch(() => {
                    // If offline, serve the offline page
                    return caches.match(OFFLINE_PAGE).then((offlineResponse) => {
                        if (offlineResponse) {
                            return offlineResponse;
                        }

                        return new Response("Offline page not found", { status: 404 });
                    });
                });
        })
    );
});

self.addEventListener("pushsubscriptionchange", (event) => {
    console.log("Push subscription change", event);

    fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            pushSubscription: self.registration.pushManager.getSubscription()
        })
    });
});

self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};

    console.log("Push event", data);

    const options = {
        body: data.options.body || "Nouvelle notification",
        icon: data.options.icon || "/logo-192-192.png",
        badge: data.options.badge || undefined,
        data: {
            url: data.options?.data?.url || "/"
        },
        silent: false,
        actions: [
            { action: "open", title: "Ouvrir" },
            { action: "dismiss", title: "Ignorer" }
        ]
    };

    const promise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject("Timeout");
        }, 5000);

        self.clients
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
                        });

                        clearTimeout(timeout);
                        resolve(true);
                    }
                }

                if (clients.length === 0) {
                    self.registration.showNotification(data.title, options).then(() => {
                        console.log("Notification sent");

                        clearTimeout(timeout);
                        resolve(true);
                    });
                }
            });
    });

    event.waitUntil(promise);
});

self.addEventListener("notificationclick", (event) => {
    console.log("Notification click", event);

    event.notification.close();

    const data = event.notification.data;

    // Check if the action is dismiss
    if (event.action === "dismiss") {
        return;
    }

    const promise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject("Timeout");
        }, 5000);

        self.clients.openWindow(data.url || "/").then((client) => {
            clearTimeout(timeout);

            return resolve(client);
        });
    });

    event.waitUntil(promise);
});

self.addEventListener("notificationclose", (event) => {
    console.log("Notification close", event);
});

self.addEventListener("notificationerror", (event) => {
    console.log("Notification error", event);
});