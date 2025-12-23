// =======================================
// SAFARI-SAFE STATIC SERVICE WORKER
// =======================================

const CACHE_NAME = "static-assets-v1"

const IMMUTABLE_EXTENSIONS = [".js", ".css", ".woff2", ".png", ".jpg", ".jpeg", ".svg", ".webp"]

// --------------------
// INSTALL
// --------------------
self.addEventListener("install", () => {
  // Do NOT call skipWaiting on Safari-sensitive SWs
})

// --------------------
// ACTIVATE
// --------------------
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))

      // Claim without forcing reloads
      await self.clients.claim()
    })()
  )
})

// --------------------
// FETCH
// --------------------
self.addEventListener("fetch", event => {
  const { request } = event

  // Never touch non-GET
  if (request.method !== "GET") return

  // Never touch HTML / navigation
  if (request.destination === "document") return

  // Never touch API / auth
  const url = new URL(request.url)
  if (url.pathname.startsWith("/api") || url.origin !== self.location.origin) {
    return
  }

  // Static assets only
  if (
    ["script", "style", "font", "image"].includes(request.destination) &&
    IMMUTABLE_EXTENSIONS.some(ext => url.pathname.endsWith(ext))
  ) {
    event.respondWith(cacheFirst(request))
  }
})

// --------------------
// CACHE-FIRST
// --------------------
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.ok && response.type === "basic") {
    cache.put(request, response.clone())
  }

  return response
}
