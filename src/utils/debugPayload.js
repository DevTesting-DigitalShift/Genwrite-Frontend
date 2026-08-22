const DEBUG_PAYLOADS = import.meta.env.VITE_DEBUG_PAYLOADS === "true"

/**
 * Logs the final validated payload to the console when VITE_DEBUG_PAYLOADS=true.
 * Set VITE_DEBUG_PAYLOADS=true in .env to enable — no AI generation needed just to test payloads.
 *
 * @param {string} label - Form/action name (e.g. "AdvancedBlog", "QuickBlog", "Job")
 * @param {*} payload - The final validated payload about to be sent to the backend
 * @returns {boolean} - true if debug mode is active (caller can early-return to skip the API call)
 */
export const debugPayload = (label, payload) => {
  if (!DEBUG_PAYLOADS) return false

  console.group(`%c[DEBUG PAYLOAD] ${label}`, "color: #a855f7; font-weight: bold; font-size: 14px;")
  console.log("%cPayload:", "color: #6366f1; font-weight: bold;", payload)
  console.log("%cJSON:", "color: #6366f1; font-weight: bold;", JSON.stringify(payload, null, 2))
  console.groupEnd()

  return true
}
