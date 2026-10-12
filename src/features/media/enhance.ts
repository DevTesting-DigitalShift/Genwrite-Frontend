import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

type MediaCatalogue = PricingCatalogue["media"]

/** Mirrors the backend's constants/mediaModelPricing.js (ENHANCE_RESOLUTIONS, RESOLUTION_HEIGHTS,
 * MAX_ENHANCE_FACTOR) and MediaService.enhanceVideo — the backend re-checks all of it, this only
 * decides which options to offer. */
const ENHANCE_MODEL = "topaz/upscale/video/precision"
const TARGET_HEIGHTS = { "1080p": 1080, "4k": 2160 } as const
const SOURCE_HEIGHTS: Record<string, number> = {
  "480p": 480,
  "540p": 540,
  "720p": 720,
  "1080p": 1080,
}
const MAX_FACTOR = 4

export type EnhanceResolution = keyof typeof TARGET_HEIGHTS
export type EnhanceOption = { resolution: EnhanceResolution; credits: number; factor: number }

/** USD → credits, rounded up after micro-cent rounding (same as the backend's usdToCredits). */
const usdToCredits = (usd: number) => Math.ceil(Number((usd * 100).toFixed(6)))

/**
 * Resolutions a finished video can be enhanced to, with their price. Empty when the video's
 * resolution/length aren't recorded (older videos, fixed-resolution models), it's already at
 * the top, or a target is already done (`alreadyEnhancedTo`).
 */
export function enhanceOptions(
  metadata: { resolution?: unknown; durationSeconds?: unknown } | null | undefined,
  catalogue: MediaCatalogue,
  alreadyEnhancedTo: string[] = []
): EnhanceOption[] {
  const sourceHeight = SOURCE_HEIGHTS[String(metadata?.resolution)]
  const seconds = Number(metadata?.durationSeconds)
  const rates = catalogue[ENHANCE_MODEL]?.resolutionPricing
  if (!sourceHeight || !seconds || !rates || catalogue[ENHANCE_MODEL]?.unavailable) return []

  return (Object.keys(TARGET_HEIGHTS) as EnhanceResolution[]).flatMap((resolution) => {
    const factor = TARGET_HEIGHTS[resolution] / sourceHeight
    const rate = rates[resolution]
    if (factor <= 1 || factor > MAX_FACTOR || rate === undefined) return []
    if (alreadyEnhancedTo.includes(resolution)) return []
    return [{ resolution, credits: usdToCredits(rate * seconds), factor }]
  })
}
