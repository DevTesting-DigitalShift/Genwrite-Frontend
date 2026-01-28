// BACKEND-SYNCED MULTIPLIERS
const GEMINI_MULTIPLIER = 1
const OPENAI_MULTIPLIER = 1.5
const CLAUDE_MULTIPLIER = 2

export const creditCostsWithGemini = Object.freeze({
  analysis: {
    competitors: 10,
    keywords: 1,
  },
  blog: {
    quick: 10,
    proofread: 5,
    single: 10,
    regenerate: 15,
  },
  tools: {
    humanize: 10,
    outline: 5,
    boost: 10,
    metadata: 5,
    rewrite: 5,
  },
  aiImages: 10,
})

/**
 * Get the estimated credit cost for a specific operation
 * @param {"analysis.competitors"|"analysis.keywords"|"blog.quick"|"blog.proofread"|"blog.single"|"blog.regenerate"|"tools.humanize"|"tools.outline"|"tools.boost"|"tools.metadata"|"tools.rewrite"|"aiImages"} type
 * @param {"gemini"|"chatgpt"|"claude"} aiModel
 * @returns {number}
 */
export function getEstimatedCost(type, aiModel = "gemini") {
  const types = type.split(".")
  let cost =
    types.length === 1 ? creditCostsWithGemini[type] : creditCostsWithGemini[types[0]][types[1]]

  if (!cost) throw new Error("Unknown Operation: No cost available")

  switch (aiModel.toLowerCase()) {
    case "openai":
    case "chatgpt":
      cost = Math.ceil(OPENAI_MULTIPLIER * cost)
      break
    case "claude":
      cost = Math.ceil(CLAUDE_MULTIPLIER * cost)
      break
    case "gemini":
    default:
      cost = Math.ceil(GEMINI_MULTIPLIER * cost)
  }

  return cost
}
