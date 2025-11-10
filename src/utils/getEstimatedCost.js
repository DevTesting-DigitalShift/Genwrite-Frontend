const CHATGPT_MULTIPLIER = 3
const CLAUDE_MULTIPLIER = 5

export const creditCostsWithGemini = Object.freeze({
  analysis: {
    competitors: 10,
    keywords: 1,
  },
  blog: {
    quick: 10,
    proofread: 5,
    single: 10,
  },
  aiImages: 10,
})

/**
 * @param {"analysis.competitors"|"analysis.keywords"|"blog.quick"|"blog.proofread"|"blog.single"|"aiImages"} type
 * @param {"gemini"|"chatgpt"|"claude"} aiModel
 * @returns {number}
 */
export function getEstimatedCost(type, aiModel = "gemini") {
  const types = type.split(".")
  let cost =
    types.length === 1 ? creditCostsWithGemini[type] : creditCostsWithGemini[types[0]][types[1]]

  if (!cost) throw new Error("Unknown Operation: No cost available")

  switch (aiModel.toLowerCase()) {
    case "chatgpt":
      cost = Math.ceil(CHATGPT_MULTIPLIER * cost)
      break
    case "claude":
      cost = Math.ceil(CLAUDE_MULTIPLIER * cost)
      break
  }

  return cost
}
