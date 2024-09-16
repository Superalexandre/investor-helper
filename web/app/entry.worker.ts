/// <reference lib="WebWorker" />

// import { PushManager } from "@remix-pwa/push/client"
// import { clearUpOldCaches, DefaultFetchHandler, EnhancedCache, isDocumentRequest, isLoaderRequest, NavigationHandler } from "@remix-pwa/sw"

export { }

declare let self: ServiceWorkerGlobalScope

self.addEventListener("install", event => {
    console.log("Service worker installed")

    event.waitUntil(self.skipWaiting())

    // event.waitUntil(assetCache.preCacheUrls(
    //     self.__workerManifest.assets.filter(url => !url.endsWith(".map") && !url.endsWith(".js"))
    // ))
})

self.addEventListener("activate", event => {
    console.log("Service worker activated")

    event.waitUntil(self.clients.claim())
    // event.waitUntil(Promise.all([
    //     clearUpOldCaches([DOCUMENT_CACHE_NAME, DATA_CACHE_NAME, ASSET_CACHE_NAME], version),
    //     self.clients.claim(),
    // ]))
})

// const version = "v2"

// const DOCUMENT_CACHE_NAME = "document-cache"
// const ASSET_CACHE_NAME = "asset-cache"
// const DATA_CACHE_NAME = "data-cache"

// const documentCache = new EnhancedCache(DOCUMENT_CACHE_NAME, {
//     version,
//     strategy: "CacheFirst",
//     strategyOptions: {
//         maxEntries: 64,
//     }
// })

// const assetCache = new EnhancedCache(ASSET_CACHE_NAME, {
//     version,
//     strategy: "CacheFirst",
//     strategyOptions: {
//         maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
//         maxEntries: 100,
//     }
// })

// const dataCache = new EnhancedCache(DATA_CACHE_NAME, {
//     version,
//     strategy: "NetworkFirst",
//     strategyOptions: {
//         networkTimeoutInSeconds: 10,
//         maxEntries: 72,
//     }
// })

// export const defaultFetchHandler: DefaultFetchHandler = ({ context }) => {
//     const request = context.event.request
//     const url = new URL(request.url)

//     if (isDocumentRequest(request)) {
//         return documentCache.handleRequest(request)
//     }

//     if (isLoaderRequest(request)) {
//         return dataCache.handleRequest(request)
//     }

//     if (self.__workerManifest.assets.includes(url.pathname)) {
//         return assetCache.handleRequest(request)
//     }

//     return fetch(request)
// }


// const messageHandler = new NavigationHandler({
//     cache: documentCache
// })

// self.addEventListener("message", (event: ExtendableMessageEvent) => {
//     event.waitUntil(messageHandler.handleMessage(event))
// })
// new PushManager({
//     handlePushEvent: (event) => {
//     // Handle incoming push event
//         console.log("Push event received", event)
//     },
//     handleNotificationClick: (event) => {
//     // Handle notification click event
//         console.log("Notification clicked", event)
//     },
//     handleNotificationClose: (event) => {
//     // Handle notification close event
//         console.log("Notification closed", event)
//     },
//     handleNotificationError: (event) => {
//     // Handle notification error event
//         console.log("Notification error", event)
//     },
// })
