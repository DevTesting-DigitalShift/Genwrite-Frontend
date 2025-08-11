import crypto from "node:crypto"
/**
 * Pushes a custom event and data to the Google Tag Manager data layer.
 * @param {object} eventData - The data object to push.
 */
export function pushToDataLayer(eventData) {
  // Ensure the dataLayer is initialized before pushing anything
  window.dataLayer = window.dataLayer || []

  // Clone and transform eventData
  const transformedData = { ...eventData }
  for (const key in transformedData) {
    if (/_id$/.test(key) && transformedData[key] != null) {
      transformedData[key] = getHashedId(transformedData[key])
    }
  }

  // Push the transformed data to the data layer
  window.dataLayer.push(transformedData)

  // Optional: Log to the console for debugging purposes
  console.debug("Pushed to dataLayer:", transformedData)
}

const getHashedId = (id) => {
  if (!id) return null
  return crypto.createHash("sha256").update(id.toString()).digest("hex")
}
