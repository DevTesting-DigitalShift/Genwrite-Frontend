import { COSTS, MODEL_MULTIPLIER } from "@/data/blogData"

/**
 * Get the estimated credit cost for a specific operation
 * @param {string} type - Dot-separated path to the cost (e.g., "ANALYSIS.COMPETITORS")
 * @param {"gemini"|"chatgpt"|"claude"} aiModel
 * @returns {number}
 */
export function getEstimatedCost(type, aiModel = "gemini") {
  const keys = type.toUpperCase().split(".")
  let cost = COSTS

  for (const key of keys) {
    if (cost[key] === undefined) {
      // Fallback for flat keys if nested not found
      if (COSTS[keys[keys.length - 1]] !== undefined) {
        cost = COSTS[keys[keys.length - 1]]
        break
      }
      throw new Error(`Unknown Operation: No cost available for ${type}`)
    }
    cost = cost[key]
  }

  // Handle case where type was just one level but it's an object (e.g. "ANALYSIS")
  if (typeof cost === "object" && keys.length === 1) {
    cost = Object.values(cost)[0]
  }

  const modelKey = aiModel.toUpperCase() === "CHATGPT" ? "OPENAI" : aiModel.toUpperCase()
  const multiplier = MODEL_MULTIPLIER[modelKey] ?? MODEL_MULTIPLIER.GEMINI

  return Math.ceil(cost * multiplier)
}
