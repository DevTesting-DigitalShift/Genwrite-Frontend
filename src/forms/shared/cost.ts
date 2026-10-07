import { useMemo } from "react"
import usePricingStore from "@store/usePricingStore"
import { computeCostBreakdown, type BlogPricing, type CostBreakdown } from "@/data/pricingConfig"
import { AI_MODELS, IMAGE_SOURCE } from "@/data/blogData"
import type { CostLine } from "@components/form/CreateFormShell"
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

/** A `CostBreakdown` scaled by how many blogs the request produces, plus that count. */
export interface GenerationCostBreakdown extends CostBreakdown {
  blogs: number
}

/**
 * Credit estimate for a generation request, mirroring the backend. Every form shares it: the
 * `options` object is exactly what `computeCostBreakdown` reads, so there is no per-form list
 * of `if (x) features.push(...)` to keep in sync with the toggles. Each line and the total are
 * scaled by `blogs` — a bulk/job request bills each generated blog on its own.
 */
export function estimateGenerationCost(
  values: CostInputs,
  pricing: BlogPricing,
  { wordCount, blogs = 1, features = [] }: CostConfig = {}
): GenerationCostBreakdown {
  const imagesOn = values.imageSource !== IMAGE_SOURCE.NONE
  const images =
    values.imageSource === IMAGE_SOURCE.UPLOAD
      ? (values.blogImages?.length ?? 0)
      : Number(values.numberOfImages) || 0

  const perBlog = computeCostBreakdown(
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

  return {
    ...perBlog,
    writingCost: perBlog.writingCost * blogs,
    lines: perBlog.lines.map((line) => ({ ...line, credits: line.credits * blogs })),
    subtotal: perBlog.subtotal * blogs,
    total: perBlog.total * blogs,
    blogs,
  }
}

/** Live cost breakdown that re-renders when the pricing catalogue loads or the form changes. */
export function useGenerationCostBreakdown(
  values: CostInputs,
  config: CostConfig = {}
): GenerationCostBreakdown {
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

/** {@link useGenerationCostBreakdown}, for call sites that only need the final number. */
export function useGenerationCost(values: CostInputs, config: CostConfig = {}): number {
  return useGenerationCostBreakdown(values, config).total
}

const MODEL_LABEL = Object.fromEntries(AI_MODELS.map((m) => [m.id, m.label]))

/** The itemized lines `CreateFormShell`'s summary card renders, built from a cost breakdown. */
export function toCostLines(breakdown: GenerationCostBreakdown): CostLine[] {
  const writing = Math.round(breakdown.writingCost)
  const modelLabel = MODEL_LABEL[breakdown.aiModel] ?? breakdown.aiModel
  return [
    { label: `Writing (${modelLabel}${breakdown.blogs > 1 ? ` × ${breakdown.blogs}` : ""})`, credits: writing },
    ...breakdown.lines.map((line) => ({ label: line.label, credits: Math.round(line.credits) })),
  ]
}
