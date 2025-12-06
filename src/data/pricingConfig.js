// Pricing configuration for the PricingCalculator
// All costs are in credits
export const pricingConfig = {
  wordCount: {
    base: 100, // words per unit
    cost: 10, // credits per base
  },
  features: {
    brandVoice: { label: "Brand Voice", cost: 10 },
    competitorResearch: { label: "Competitor Research", cost: 10 },
    keywordResearch: { label: "Keyword Research", cost: 10 },
    internalLinking: { label: "Internal Linking", cost: 10 },
    faqGeneration: { label: "FAQ Generation", cost: 10 },
    automaticPosting: { label: "Automatic Posting", cost: 10 },
  },
  images: { stock: { featureFee: 10 }, ai: { featureFee: 20 }, upload: { perImageFee: 5 } },
  aiModels: {
    gemini: { label: "Gemini", costMultiplier: 1 },
    chatgpt: { label: "ChatGPT", costMultiplier: 1.5 },
    claude: { label: "Claude", costMultiplier: 2 },
  },
}

/**
 * Compute the cost for blog content generation
 * @param {Object} options - Cost calculation options
 * @param {number} options.wordCount - Number of words in the blog
 * @param {string[]} [options.features=[]] - Array of feature keys (e.g., ['brandVoice', 'keywordResearch'])
 * @param {string} [options.aiModel='gemini'] - AI model to use ('gemini', 'chatgpt', 'claude')
 * @param {boolean} [options.includeImages=false] - Whether to include images in the blog
 * @param {string} [options.imageSource='stock'] - Image source type ('stock', 'ai', 'upload')
 * @param {number} [options.numberOfImages=0] - Number of images (for upload option only)
 * @returns {number} Total cost in credits
 */
export function computeCost({
  wordCount,
  features = [],
  aiModel = "gemini",
  includeImages = false,
  imageSource = "stock",
  numberOfImages = 0,
}) {
  let cost = 0

  // Base cost for word count (AI multiplier applies ONLY here)
  const wordUnits = Math.ceil(wordCount / pricingConfig.wordCount.base)
  const baseCost = wordUnits * pricingConfig.wordCount.cost
  const multiplier = pricingConfig.aiModels[aiModel]?.costMultiplier || 1
  cost += Math.round(baseCost * multiplier)

  // Add feature costs (NO multiplier)
  features.forEach(featureKey => {
    if (pricingConfig.features[featureKey]) {
      cost += pricingConfig.features[featureKey].cost
    }
  })

  // Add image costs (NO multiplier)
  if (includeImages) {
    if (imageSource === "stock") {
      cost += pricingConfig.images.stock.featureFee
    } else if (imageSource === "ai") {
      cost += pricingConfig.images.ai.featureFee
    } else if (imageSource === "upload") {
      cost += pricingConfig.images.upload.perImageFee * numberOfImages
    }
  }

  return Math.round(cost)
}
