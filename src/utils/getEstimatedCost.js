const CHATGPT_MULTIPLIER = 3;
const CLAUDE_MULTIPLIER = 5;

export const creditCostswithGemini = Object.freeze({
  analysis: {
    competitors: 10, // competitor summaries & deep analysis using AI
    keywords: 1,     // keyword suggestion per title
  },
  blog: {
    quick: 5,       // quick blog with 1 image
    proofread: 5,
    single: 10,     // single blog without images / unstock images
  },
  aiImages: 10,      // credits to add for AI images (fixed for all AI as using DALL·E 3)
});

/**
 *
 * @param {"analysis.competitors"|"analysis.keywords"|"blog.quick"|"blog.proofread"|"blog.single"|"aiImages"} type
 * @param {"gemini"|"chatgpt"|"claude"} aiModel
 * @returns {number}
 */
export function getEstimatedCost(type, aiModel = "gemini") {
  const types = type.split(".");
  let cost =
    types.length === 1
      ? creditCostswithGemini[type]
      : creditCostswithGemini[types[0]][types[1]];

  if (!cost) throw new Error("Unknown Operation: No cost available");

  switch (aiModel.toLowerCase()) {
    case "chatgpt":
      cost = Math.ceil(CHATGPT_MULTIPLIER * cost);
      break;
    case "claude":
      cost = Math.ceil(CLAUDE_MULTIPLIER * cost);
      break;
    // "gemini" or any unrecognized default will stay base
  }

  return cost;
}
