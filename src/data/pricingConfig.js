// Pricing configuration for the PricingCalculator
// All costs are in credits - Updated image source handling
export const pricingConfig = {
  wordCount: {
    base: 100, // words per unit
    cost: 5, // credits per base
  },
  features: {
    brandVoice: { label: "Brand Voice", cost: 10 },
    competitorResearch: { label: "Competitor Research", cost: 10 },
    keywordResearch: { label: "Keyword Research", cost: 10 },
    internalLinking: { label: "Internal Linking", cost: 10 },
    faqGeneration: { label: "FAQ Generation", cost: 10 },
    automaticPosting: { label: "Automatic Posting", cost: 10 },
    quickSummary: { label: "Quick Summary", cost: 10 },
    outboundLinks: { label: "Outbound Links", cost: 10 },
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
 * @param {Object} params - Cost calculation options
 * @param {number} params.wordCount - Number of words in the blog
 * @param {string[]} [params.features=[]] - Array of feature keys (e.g., ['brandVoice', 'keywordResearch'])
 * @param {string} [params.aiModel='gemini'] - AI model to use ('gemini', 'chatgpt', 'claude')
 * @param {boolean} [params.includeImages=false] - Whether to include images in the blog
 * @param {string} [params.imageSource='stock'] - Image source type ('stock', 'ai', 'upload')
 * @param {number} [params.numberOfImages=0] - Number of images (for upload option only)
 * @param {Object} [params.options={}] - Additional options object (for backward compatibility)
 * @param {boolean} [params.isCheckedBrand=false] - Whether brand voice is enabled
 * @param {boolean} [params.costCutter=false] - Whether cost cutter is enabled
 * @returns {number} Total cost in credits
 */
export function computeCost({
  wordCount = 1000,
  features = [],
  aiModel = "gemini",
  options = {},
  isCheckedBrand = false,
  includeImages = false,
  imageSource = "stock",
  numberOfImages = 0,
  costCutter = false,
}) {
  let totalCost = 0

  // 1. Word Cost
  const wordUnits = Math.ceil(wordCount / pricingConfig.wordCount.base)
  const baseWordCost = wordUnits * pricingConfig.wordCount.cost

  // 2. AI multiplier
  const multiplier = pricingConfig.aiModels[aiModel]?.costMultiplier || 1
  totalCost += baseWordCost * multiplier

  // 3. Feature Costs
  // Support both features array (from AdvancedBlogModal) and options object (from other modals)
  if (isCheckedBrand || features.includes("brandVoice")) {
    totalCost += pricingConfig.features.brandVoice.cost
  }
  if (options.includeCompetitorResearch || features.includes("competitorResearch")) {
    totalCost += pricingConfig.features.competitorResearch.cost
  }
  if (options.performKeywordResearch || features.includes("keywordResearch")) {
    totalCost += pricingConfig.features.keywordResearch.cost
  }
  if (options.includeInterlinks || features.includes("internalLinking")) {
    totalCost += pricingConfig.features.internalLinking.cost
  }
  if (options.includeFaqs || features.includes("faqGeneration")) {
    totalCost += pricingConfig.features.faqGeneration.cost
  }
  if (options.automaticPosting || features.includes("automaticPosting")) {
    totalCost += pricingConfig.features.automaticPosting.cost
  }
  if (options.isCheckedQuick || features.includes("quickSummary")) {
    totalCost += pricingConfig.features.quickSummary.cost
  }
  if (options.addOutBoundLinks || features.includes("outboundLinks")) {
    totalCost += pricingConfig.features.outboundLinks.cost
  }

  // 4. Image Costs
  if (includeImages) {
    // Handle both naming conventions: unsplash/stock, ai-generated/ai, custom/upload
    if (imageSource === "stock" || imageSource === "unsplash") {
      totalCost += pricingConfig.images.stock.featureFee
    } else if (imageSource === "ai" || imageSource === "ai-generated") {
      totalCost += pricingConfig.images.ai.featureFee
    } else if (
      imageSource === "upload" ||
      imageSource === "custom" ||
      imageSource === "customImage"
    ) {
      totalCost += pricingConfig.images.upload.perImageFee * numberOfImages
    }
  }

  // 5. Cost cutter toggle
  if (costCutter) totalCost = Math.round(totalCost * 0.75)

  return Math.ceil(totalCost)
}
