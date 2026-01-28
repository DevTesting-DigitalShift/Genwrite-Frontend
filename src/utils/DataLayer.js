/**
 * Pushes a custom event and data to the Google Tag Manager data layer.
 * @param {object} eventData - The data object to push.
 */
export function pushToDataLayer(eventData) {
  // Ensure the dataLayer is initialized before pushing anything
  window.dataLayer = window.dataLayer || []
  const transformedData = { ...eventData }
  // Collect promises for all _id hashes
  const hashPromises = Object.keys(transformedData).map(async key => {
    if (/_id$/.test(key) && transformedData[key] != null) {
      try {
        const hash = await getHashedId(transformedData[key])
        transformedData[key] = hash
      } catch (err) {
        console.error(err)
        transformedData[key] = "id_" + Date.now().toString()
      }
    }
    // If not an ID, return a resolved promise so Promise.all works
    return Promise.resolve()
  })

  // Chain the `.then()` for when *all* hashes are done
  Promise.all(hashPromises)
    .then(() => {
      try {
        window.dataLayer.push(transformedData)
      } catch (error) {
        // Silent fail if GTM is blocked (ad blockers, CORS, etc.)
        if (import.meta.env.NODE_ENV === "development") {
          console.warn("[DataLayer] Failed to push event:", error, transformedData)
        }
      }
    })
    .catch(error => {
      // Catch any hashing errors
      if (import.meta.env.NODE_ENV === "development") {
        console.warn("[DataLayer] Hashing failed:", error)
      }
    })
}

/**
 * Hash a given ID to SHA-256 hex using Web Crypto API
 * @param {string|number} id - ID to hash
 * @returns {Promise<string>} - SHA-256 hash in hex
 */
async function getHashedId(id) {
  if (!id) return null

  // Convert string to Uint8Array
  const encoder = new TextEncoder()
  const data = encoder.encode(id.toString())

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}
