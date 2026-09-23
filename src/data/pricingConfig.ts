import usePricingStore from "@store/usePricingStore"
import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

export type BlogPricing = PricingCatalogue["blog"]

/** `options{}` keys the blog forms send, mapped to the pricing feature they bill as —
 * identical to GenWrite-Backend's blog.pricing.js#computeCost. */
const OPTION_TO_FEATURE: Record<string, string> = {
  includeCompetitorResearch: "competitorResearch",
  performKeywordResearch: "keywordResearch",
  includeInterlinks: "internalLinking",
  includeFaqs: "faqGeneration",
  automaticPosting: "automaticPosting",
  humanisation: "humanisation",
  extendedThinking: "extendedThinking",
  deepResearch: "deepResearch",
}

/**
 * Estimated credit cost of generating a blog — a line-for-line mirror of the backend's
 * blog.pricing.js#computeCost (same word-unit rounding, model multiplier, feature fees, image
 * fees and cost-cutter rounding), fed by the live pricing catalogue so prices never drift.
 * A feature only costs something if the backend's catalogue lists it: e.g. `quickSummary` is
 * free until the backend adds a price for it, and then it's picked up automatically.
 *
 * @param blogPricing - the catalogue's `blog` slice; components should pass
 *   `usePricingStore(s => s.catalogue.blog)` so the estimate re-renders when it loads.
 */
export function computeCost(
  {
    wordCount = 1000,
    features = [],
    aiModel = "gemini",
    options = {},
    isCheckedBrand = false,
    includeImages = false,
    imageSource = "stock",
    numberOfImages = 0,
    costCutter = false,
  }: {
    wordCount?: number
    features?: string[]
    aiModel?: string
    options?: Record<string, unknown>
    isCheckedBrand?: boolean
    includeImages?: boolean
    imageSource?: string
    numberOfImages?: number
    costCutter?: boolean
  },
  blogPricing: BlogPricing = usePricingStore.getState().catalogue.blog
): number {
  const featurePrices = blogPricing.features as Record<string, { cost: number }>

  // 1. Word cost
  const wordUnits = Math.ceil(wordCount / blogPricing.wordCount.base)
  const wordCost = wordUnits * blogPricing.wordCount.cost

  // 2. AI multiplier
  const aiModels = blogPricing.aiModels as Record<string, { costMultiplier: number }>
  const aiMultiplier = aiModels[(aiModel || "gemini").toLowerCase()]?.costMultiplier || 1

  // 3. Features — options{} keys and features[] keys both count, each feature at most once
  const enabled = new Set(features)
  if (isCheckedBrand) enabled.add("brandVoice")
  for (const [option, feature] of Object.entries(OPTION_TO_FEATURE)) {
    if (options?.[option]) enabled.add(feature)
  }
  let featuresCost = 0
  for (const feature of enabled) featuresCost += featurePrices[feature]?.cost ?? 0

  // 4. Images
  let imagesCost = 0
  if (includeImages) {
    if (imageSource === "stock" || imageSource === "unsplash") {
      imagesCost = blogPricing.images.stock.featureFee
    } else if (imageSource === "ai" || imageSource === "ai-generated") {
      imagesCost = blogPricing.images.ai.featureFee
    } else if (
      imageSource === "upload" ||
      imageSource === "custom" ||
      imageSource === "customImage"
    ) {
      imagesCost = blogPricing.images.upload.perImageFee * numberOfImages
    }
  }

  // 5. Cost cutter — Math.round(total * 0.5), as the backend charges it (getTotalCreditCostForBlog).
  // Pass `costCutter` here rather than halving the returned number: halving an already-rounded
  // total can land one credit off the real charge.
  const rawTotal = wordCost * aiMultiplier + featuresCost + imagesCost
  return Math.ceil(costCutter ? Math.round(rawTotal * 0.5) : rawTotal)
}
