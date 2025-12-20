// ==================================================
// HARD RESET PRODUCTION SERVICE WORKER (Vite / React)
// ==================================================

// Unique cache per deployment (scope changes on redeploy)
const CACHE_NAME = `app-static-${self.registration.scope}`

// Immutable assets only (hashed by Vite)
const IMMUTABLE_EXTENSIONS = [".js", ".css", ".woff2", ".png", ".jpg", ".jpeg", ".svg", ".webp"]

// --------------------------------------------------
// INSTALL: Activate immediately
// --------------------------------------------------
self.addEventListener("install", () => {
  self.skipWaiting()
})

// --------------------------------------------------
// ACTIVATE: FULL PURGE of old data
// --------------------------------------------------
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      // 1. Delete ALL existing caches
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))

      // 2. Take control of all open clients immediately
      await self.clients.claim()

      // 3. Force all tabs to reload latest version
      const clients = await self.clients.matchAll({ type: "window" })
      clients.forEach(client => {
        client.navigate(client.url)
      })
    })()
  )
})

// --------------------------------------------------
// FETCH HANDLER
// --------------------------------------------------
self.addEventListener("fetch", event => {
  const { request } = event
  const url = new URL(request.url)

  // ---- NEVER INTERCEPT NON-GET ----
  if (request.method !== "GET") return

  // ---- NEVER CACHE HTML ----
  if (request.destination === "document") {
    event.respondWith(fetch(request, { cache: "no-store" }))
    return
  }

  // ---- NEVER CACHE API / AUTH ----
  if (url.pathname.startsWith("/api") || url.origin.includes("api.")) {
    return
  }

  // ---- CACHE IMMUTABLE STATIC ASSETS ----
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    if (IMMUTABLE_EXTENSIONS.some(ext => url.pathname.endsWith(ext))) {
      event.respondWith(cacheFirst(request))
    }
  }
})

// --------------------------------------------------
// CACHE-FIRST STRATEGY
// --------------------------------------------------
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) return cached

  const response = await fetch(request)
  if (response && response.status === 200) {
    cache.put(request, response.clone())
  }

  return response
}
