import { useMemo } from "react"
import usePricingStore from "@store/usePricingStore"
import { computeCost, type BlogPricing } from "@/data/pricingConfig"
import { IMAGE_SOURCE } from "@/data/blogData"
import type { GenerationOptions } from "./options"

/** The slice of any generation form that the credit estimate reads. */
export interface CostInputs {
  options: GenerationOptions
  isCheckedBrand?: boolean
  aiModel: string
  costCutter: boolean
  imageSource: string
  numberOfImages: number | ""
  blogImages?: unknown[]
  userDefinedLength?: number
}

interface CostConfig {
  /** Word count when the form has no length control (quick blogs are fixed). */
  wordCount?: number
  /** Blogs in the request; each is billed on its own, so the cost cutter applies per blog. */
  blogs?: number
  /** Billed features that are not `options` toggles (e.g. "quickSummary"). */
  features?: string[]
}

/**
 * Credit estimate for a generation request, mirroring the backend. Every form shares it:
 * the `options` object is exactly what `computeCost` reads, so there is no per-form list of
 * `if (x) features.push(...)` to keep in sync with the toggles.
 */
export function estimateGenerationCost(
  values: CostInputs,
  pricing: BlogPricing,
  { wordCount, blogs = 1, features = [] }: CostConfig = {}
): number {
  const imagesOn = values.imageSource !== IMAGE_SOURCE.NONE
  const images =
    values.imageSource === IMAGE_SOURCE.UPLOAD
      ? (values.blogImages?.length ?? 0)
      : Number(values.numberOfImages) || 0

  const perBlog = computeCost(
    {
      wordCount: wordCount ?? values.userDefinedLength,
      features,
      aiModel: values.aiModel || "gemini",
      options: values.options,
      isCheckedBrand: values.isCheckedBrand,
      includeImages: imagesOn,
      imageSource: values.imageSource,
      numberOfImages: images,
      costCutter: values.costCutter,
    },
    pricing
  )
  return perBlog * blogs
}

/** Live estimate that re-renders when the pricing catalogue loads or the form changes. */
export function useGenerationCost(values: CostInputs, config: CostConfig = {}) {
  const pricing = usePricingStore((s) => s.catalogue.blog)
  const { wordCount, blogs, features } = config
  const featureKey = features?.join(",")
  const optionsKey = JSON.stringify(values.options)

  // biome-ignore lint/correctness/useExhaustiveDependencies: options/features are keyed by value above
  return useMemo(
    () => estimateGenerationCost(values, pricing, { wordCount, blogs, features }),
    [
      pricing,
      optionsKey,
      featureKey,
      wordCount,
      blogs,
      values.isCheckedBrand,
      values.aiModel,
      values.costCutter,
      values.imageSource,
      values.numberOfImages,
      values.blogImages?.length,
      values.userDefinedLength,
    ]
  )
}
