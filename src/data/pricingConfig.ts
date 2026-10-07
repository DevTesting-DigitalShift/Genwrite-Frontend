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

export interface CostInput {
  wordCount?: number
  features?: string[]
  aiModel?: string
  options?: Record<string, unknown>
  isCheckedBrand?: boolean
  includeImages?: boolean
  imageSource?: string
  numberOfImages?: number
  costCutter?: boolean
}

/** One priced line in a cost breakdown — a feature fee, the image fee, or the base write itself. */
export interface CostLine {
  label: string
  credits: number
}

export interface CostBreakdown {
  /** Word count × AI model multiplier — the base cost of writing the piece. */
  writingCost: number
  aiModel: string
  aiMultiplier: number
  /** One line per billed feature/image, in the order they were enabled. */
  lines: CostLine[]
  /** Sum of `writingCost` and every line, before the cost-cutter halving. */
  subtotal: number
  costCutter: boolean
  /** Final credits charged — `subtotal`, halved and rounded if `costCutter` is on. */
  total: number
}

const FEATURE_LABELS: Record<string, string> = {
  brandVoice: "Brand voice",
  competitorResearch: "Competitor research",
  keywordResearch: "Keyword research",
  internalLinking: "Internal linking",
  faqGeneration: "FAQ generation",
  automaticPosting: "Automatic posting",
  humanisation: "Humanisation",
  extendedThinking: "Extended thinking",
  deepResearch: "Deep research",
}

const IMAGE_LABELS: Record<string, string> = {
  stock: "Stock images",
  unsplash: "Stock images",
  ai: "AI images",
  "ai-generated": "AI images",
  upload: "Uploaded images",
  custom: "Uploaded images",
  customImage: "Uploaded images",
}

/**
 * Line-for-line mirror of the backend's blog.pricing.js#computeCost (same word-unit rounding,
 * model multiplier, feature fees, image fees and cost-cutter rounding), fed by the live pricing
 * catalogue so prices never drift. A feature only costs something if the backend's catalogue
 * lists it: e.g. `quickSummary` is free until the backend adds a price for it, and then it's
 * picked up automatically. Returns every line that went into the total, for a sidebar breakdown.
 *
 * @param blogPricing - the catalogue's `blog` slice; components should pass
 *   `usePricingStore(s => s.catalogue.blog)` so the estimate re-renders when it loads.
 */
export function computeCostBreakdown(
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
  }: CostInput,
  blogPricing: BlogPricing = usePricingStore.getState().catalogue.blog
): CostBreakdown {
  const featurePrices = blogPricing.features as Record<string, { cost: number }>

  // 1. Word cost
  const wordUnits = Math.ceil(wordCount / blogPricing.wordCount.base)
  const wordCost = wordUnits * blogPricing.wordCount.cost

  // 2. AI multiplier
  const aiModels = blogPricing.aiModels as Record<string, { costMultiplier: number }>
  const resolvedModel = (aiModel || "gemini").toLowerCase()
  const aiMultiplier = aiModels[resolvedModel]?.costMultiplier || 1
  const writingCost = wordCost * aiMultiplier

  // 3. Features — options{} keys and features[] keys both count, each feature at most once
  const enabled = new Set(features)
  if (isCheckedBrand) enabled.add("brandVoice")
  for (const [option, feature] of Object.entries(OPTION_TO_FEATURE)) {
    if (options?.[option]) enabled.add(feature)
  }
  const lines: CostLine[] = []
  for (const feature of enabled) {
    const credits = featurePrices[feature]?.cost ?? 0
    if (credits > 0) lines.push({ label: FEATURE_LABELS[feature] ?? feature, credits })
  }

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
    if (imagesCost > 0) lines.push({ label: IMAGE_LABELS[imageSource] ?? "Images", credits: imagesCost })
  }

  // 5. Cost cutter — Math.round(total * 0.5), as the backend charges it (getTotalCreditCostForBlog).
  // Applied to the raw subtotal rather than halving an already-rounded total, which can land
  // one credit off the real charge.
  const subtotal = writingCost + lines.reduce((sum, line) => sum + line.credits, 0)
  const total = Math.ceil(costCutter ? Math.round(subtotal * 0.5) : subtotal)

  return { writingCost, aiModel: resolvedModel, aiMultiplier, lines, subtotal, costCutter, total }
}

/** {@link computeCostBreakdown}, for call sites that only need the final number. */
export function computeCost(input: CostInput, blogPricing?: BlogPricing): number {
  return computeCostBreakdown(input, blogPricing).total
}
