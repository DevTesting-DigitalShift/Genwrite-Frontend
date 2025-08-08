/**
 * Pushes a custom event and data to the Google Tag Manager data layer.
 * @param {object} eventData - The data object to push.
 */
export function pushToDataLayer(eventData) {
  // Ensure the dataLayer is initialized before pushing anything
  window.dataLayer = window.dataLayer || []

  // Push the data to the data layer
  window.dataLayer.push(eventData)

  // Optional: Log to the console for debugging purposes
  console.debug("Pushed to dataLayer:", eventData)
}
