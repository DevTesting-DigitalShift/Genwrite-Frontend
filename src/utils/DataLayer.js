/**
 * Pushes a custom event and data to the Google Tag Manager data layer.
 * @param {object} eventData - The data object to push.
 */
export function pushToDataLayer(eventData) {
  // Ensure the dataLayer is initialized before pushing anything
  window.dataLayer = window.dataLayer || []
  const transformedData = { ...eventData }
  // Collect promises for all _id hashes
  const hashPromises = Object.keys(transformedData).map(async (key) => {
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
  Promise.all(hashPromises).then(() => {
    window.dataLayer.push(transformedData)
  })
}
