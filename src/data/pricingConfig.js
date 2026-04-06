import { COSTS, MODEL_MULTIPLIER } from "@/data/blogData"

// Pricing configuration for the PricingCalculator
// All costs are in credits - Updated image source handling
export const pricingConfig = {
  wordCount: {
    base: 100, // words per unit
    cost: 10, // Normalized cost per unit, scaled by overall blog cost logic
  },
  features: {
    brandVoice: { label: "Brand Voice", cost: 10 },
    competitorResearch: { label: "Competitor Research", cost: COSTS.ANALYSIS.COMPETITORS },
    keywordResearch: { label: "Keyword Research", cost: COSTS.ANALYSIS.KEYWORDS },  
    internalLinking: { label: "Internal Linking", cost: 10 },
    faqGeneration: { label: "FAQ Generation", cost: 10 },
    automaticPosting: { label: "Automatic Posting", cost: 10 },
    humanisation: { label: "AI Humanisation", cost: COSTS.BLOG.HUMANISED_CONTENT },
    extendedThinking: { label: "Extended Thinking", cost: 15 },
    deepResearch: { label: "Deep Research", cost: 15 },
    quickSummary: { label: "Quick Summary", cost: 10 },
  },
  images: { 
    stock: { featureFee: 10 }, 
    ai: { featureFee: COSTS.IMAGE.GENERATE * 10 }, // Scaling appropriately
    upload: { perImageFee: 5 } 
  },
  aiModels: {
    gemini: { label: "Gemini", costMultiplier: MODEL_MULTIPLIER.GEMINI },
    openai: { label: "OpenAI", costMultiplier: MODEL_MULTIPLIER.OPENAI },
    chatgpt: { label: "ChatGPT", costMultiplier: MODEL_MULTIPLIER.CHATGPT },
    claude: { label: "Claude", costMultiplier: MODEL_MULTIPLIER.CLAUDE },
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
  const aiModelKey = (aiModel || "gemini").toLowerCase()
  const multiplier = pricingConfig.aiModels[aiModelKey]?.costMultiplier || 1
  totalCost += baseWordCost * multiplier

  // 3. Feature Costs
  const hasFeature = feat => features.includes(feat)
  const hasOption = opt => !!(options && options[opt])

  if (isCheckedBrand || hasFeature("brandVoice")) {
    totalCost += pricingConfig.features.brandVoice.cost
  }
  if (hasOption("includeCompetitorResearch") || hasFeature("competitorResearch")) {
    totalCost += pricingConfig.features.competitorResearch.cost
  }
  if (hasOption("performKeywordResearch") || hasFeature("keywordResearch")) {
    totalCost += pricingConfig.features.keywordResearch.cost
  }
  if (hasOption("includeInterlinks") || hasFeature("internalLinking")) {
    totalCost += pricingConfig.features.internalLinking.cost
  }
  if (hasOption("includeFaqs") || hasFeature("faqGeneration")) {
    totalCost += pricingConfig.features.faqGeneration.cost
  }
  if (hasOption("automaticPosting") || hasFeature("automaticPosting")) {
    totalCost += pricingConfig.features.automaticPosting.cost
  }
  if (hasOption("humanisation") || hasFeature("humanisation")) {
    totalCost += pricingConfig.features.humanisation.cost
  }
  if (hasOption("extendedThinking") || hasFeature("extendedThinking")) {
    totalCost += pricingConfig.features.extendedThinking.cost
  }
  if (hasOption("deepResearch") || hasFeature("deepResearch")) {
    totalCost += pricingConfig.features.deepResearch.cost
  }
  if (hasOption("quickSummary") || hasFeature("quickSummary") || options.isCheckedQuick) {
    totalCost += pricingConfig.features.quickSummary.cost
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
  if (costCutter) totalCost = Math.round(totalCost * 0.5)

  return Math.ceil(totalCost)
}

// Once one step has been run there will be no credits refunded for that step even in failure
