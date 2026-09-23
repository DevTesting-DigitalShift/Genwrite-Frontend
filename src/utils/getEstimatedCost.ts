import { getCosts } from "@/data/costs"

type CostNode = number | { [key: string]: CostNode }

/**
 * Get the estimated credit cost for a specific operation, from the live pricing catalogue.
 *
 * @param type - Dot-separated path to the cost (e.g., "ANALYSIS.COMPETITORS", "tools.pdf_chat")
 */
export function getEstimatedCost(type: string, aiModel: string = "gemini"): number {
  const { MODEL_MULTIPLIER, ...costs } = getCosts()
  const keys = type.toUpperCase().split(".")
  const root = costs as unknown as Record<string, CostNode>
  let cost: CostNode = root

  for (const key of keys) {
    const current = cost as { [k: string]: CostNode }
    if (current[key] === undefined) {
      // Fallback for flat keys if nested not found
      const flatKey = keys[keys.length - 1]
      if (root[flatKey] !== undefined) {
        cost = root[flatKey]
        break
      }
      throw new Error(`Unknown Operation: No cost available for ${type}`)
    }
    cost = current[key]
  }

  // Handle case where type was just one level but it's an object (e.g. "ANALYSIS")
  if (typeof cost === "object" && keys.length === 1) {
    cost = Object.values(cost)[0]
  }

  const modelKey = aiModel.toUpperCase() === "CHATGPT" ? "OPENAI" : aiModel.toUpperCase()
  const multiplier = MODEL_MULTIPLIER[modelKey] ?? MODEL_MULTIPLIER.GEMINI ?? 1

  return Math.ceil((cost as number) * multiplier)
}
