// | Model        | Cost per 1K tokens (input+output) | Approx Cost Ratio (ChatGPT / Gemini) |
// | ------------ | --------------------------------- | ------------------------------------ |
// | Gemini Flash | ~ $ 0.0125 (estimated)            | 1x (baseline)                        |
// | GPT-4 Turbo  | ~ $ 0.045  (estimated)            | ~3.6x Gemini                        |

const CHATGPT_MULTIPLIER = 3.5

export const creditCostswithGemini = Object.freeze({
  analysis: {
    competitors: 10, // competitor summaries & deep analysis using ai
    keywords: 1, // keywords suggestion per title
  },
  blog: {
    quick: 5, // quick blog with 1 image
    proofread: 5,
    single: 10, // single blog without images / unstock images
  },
  aiImages: 10, // credits to add for ai images (fixed for all ai as using dall-e-3 for all)
})

/**
 *
 * @param {"analysis.competitors"|"analysis.keywords"|"blog.quick"|"blog.proofread"|"blog.single"|"aiImages"} type
 * @param {string} [aiModel]
 * @returns {number}
 */
export function getEstimatedCost(type, aiModel = "gemini") {
  const types = type.split(".")
  let cost =
    types.length == 1 ? creditCostswithGemini[type] : creditCostswithGemini[types[0]][types[1]]
  if (!cost) throw new Error("Unknown Operation: No cost avaliable")
  if (aiModel.toLowerCase() != "gemini") {
    cost = Math.ceil(CHATGPT_MULTIPLIER * cost)
  }
  return cost
}

console.log(getEstimatedCost("blog.proofread"))
