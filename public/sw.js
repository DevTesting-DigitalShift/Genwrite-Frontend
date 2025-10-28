// ============================================
// SERVICE WORKER - Detailed Explanation
// File: public/sw.js
// ============================================

const CACHE_NAME = "app-v1.0.0"
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"]

// ============================================
// 1. INSTALL EVENT - Runs when SW is first registered
// ============================================
// This event fires ONCE when the Service Worker is first installed
// Use it to cache essential static files that should ALWAYS be available

self.addEventListener("install", event => {
  // event.waitUntil() tells the browser: "Wait, don't finish installing until this promise completes"
  // If this fails, the entire Service Worker installation fails
  event.waitUntil(
    // caches.open(CACHE_NAME) creates or opens a cache storage with the name 'app-v1'
    // Think of it like creating a folder on the user's computer to store files
    caches.open(CACHE_NAME).then(cache => {
      // cache.addAll() downloads and stores these files in the cache
      // If ANY of these files fail to download, the entire operation fails
      // This ensures the app works offline if you include key files
      return cache.addAll(STATIC_ASSETS)
    })
  )

  // self.skipWaiting() tells the browser to activate this SW immediately
  // Without this, the old SW version stays active until the user closes and reopens the tab
  self.skipWaiting()
})

// ============================================
// 2. ACTIVATE EVENT - Runs when SW becomes active
// ============================================
// This event fires when the Service Worker is activated
// Use it to clean up old cache versions from previous deployments

self.addEventListener("activate", event => {
  event.waitUntil(
    // caches.keys() returns an array of all cache names created by this app
    // Example: ['app-v1', 'app-v2', 'app-v3'] if you've deployed multiple times
    caches.keys().then(cacheNames => {
      // Promise.all() waits for ALL operations inside to complete
      return Promise.all(
        // .map() loops through each cache name
        cacheNames.map(cacheName => {
          // If cacheName is NOT equal to CACHE_NAME (the current version)
          if (cacheName !== CACHE_NAME) {
            // Delete that old cache to free up storage
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  // self.clients.claim() makes this SW take control of ALL pages immediately
  // Without this, old pages might still use the old SW until refresh
  self.clients.claim()
})

// ============================================
// 3. FETCH EVENT - Runs for EVERY network request
// ============================================
// This is where the magic happens - you intercept every request and decide
// whether to serve from cache, network, or a combination

self.addEventListener("fetch", event => {
  const { request } = event
  const url = new URL(request.url)

  // -------- SKIP API CALLS --------
  // API calls should NEVER be cached (or cached very briefly)
  // Your data changes, so you always want fresh data from the server
  if (url.origin === "http://localhost:8000" || url.hostname === "https://api.genwrite.co") {
    // Just pass it through to the network - no caching
    event.respondWith(fetch(request))
    return // IMPORTANT: Exit here so the code below doesn't run
  }

  if (url.protocol === "chrome-extension:" || url.protocol === "moz-extension:") {
    return // Don't intercept extension requests
  }

  // -------- CACHE-FIRST STRATEGY FOR STATIC ASSETS --------
  // This is the main caching logic for JS, CSS, images, fonts

  event.respondWith(
    // caches.match(request) looks in all caches for a response that matches this request
    // Returns the cached response if found, or null if not found
    caches
      .match(request)
      .then(response => {
        // If we found it in cache, return it immediately (fast!)
        // This is why repeat visits are super fast
        if (response) {
          return response
        }

        // If NOT in cache, fetch from the network
        return fetch(request).then(response => {
          // Check if response is valid (status 200, not an error)
          // We check response.ok (true for status 200-299)
          if (!response || response.status !== 200) {
            // Don't cache error responses, just return them
            return response
          }

          // Clone the response because we need to:
          // 1. Store one copy in cache
          // 2. Return one copy to the user
          // We can't use the same response twice
          const responseToCache = response.clone()

          // Add this response to the cache for future requests
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache)
          })

          // Return the original response to the user
          return response
        })
      })
      // Catch errors if the network is completely down
      .catch(() => {
        // You could return a fallback page or offline page here
        // For now, just let it fail gracefully
        return new Response("Network request failed", { status: 503 })
      })
  )
})

// // ============================================
// // TIME-LIMITED CACHE STRATEGY (Optional Advanced Version)
// // ============================================
// // Use this version if you want to cache responses but invalidate them after X minutes

// const CACHE_EXPIRY_MINUTES = 60 // Cache responses for 60 minutes

// self.addEventListener("fetch", event => {
//   const { request } = event
//   const url = new URL(request.url)

//   // Skip API calls - always fetch fresh
//   if (url.pathname.startsWith("/api/")) {
//     event.respondWith(fetch(request))
//     return
//   }

//   event.respondWith(
//     caches
//       .match(request)
//       .then(cachedResponse => {
//         // If in cache, check if it's expired
//         if (cachedResponse) {
//           // Get the timestamp when this was cached (stored in metadata)
//           const cacheTime = cachedResponse.headers.get("sw-cache-time")

//           if (cacheTime) {
//             const now = Date.now()
//             const cacheAgeMinutes = (now - parseInt(cacheTime)) / 1000 / 60

//             // If cache is still fresh (within time limit), use it
//             if (cacheAgeMinutes < CACHE_EXPIRY_MINUTES) {
//               return cachedResponse
//             }
//             // If expired, fall through to fetch fresh version
//           }
//         }

//         // Fetch fresh version from network
//         return fetch(request).then(response => {
//           if (!response || response.status !== 200) {
//             return response
//           }

//           const responseToCache = response.clone()

//           // Create a new response with cache timestamp header
//           const headersWithTime = new Headers(responseToCache.headers)
//           headersWithTime.append("sw-cache-time", Date.now().toString())

//           const responseWithTime = new Response(responseToCache.body, {
//             status: responseToCache.status,
//             statusText: responseToCache.statusText,
//             headers: headersWithTime,
//           })

//           caches.open(CACHE_NAME).then(cache => {
//             cache.put(request, responseWithTime)
//           })

//           return response
//         })
//       })
//       .catch(() => {
//         return new Response("Network request failed", { status: 503 })
//       })
//   )
// })
