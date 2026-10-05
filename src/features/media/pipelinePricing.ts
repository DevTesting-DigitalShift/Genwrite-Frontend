import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

type MediaCatalogue = PricingCatalogue["media"]
export type AspectRatio = "16:9" | "9:16"
export type VideoResolution = "480p" | "720p" | "1080p"

/** What the backend uses when no resolution is picked (DEFAULT_VIDEO_RESOLUTION). */
export const DEFAULT_RESOLUTION: VideoResolution = "720p"

/** Subtitle add-on: forced alignment ($0.22) + one VEED render ($0.10) — SUBTITLES_USD. */
const SUBTITLES_USD = 0.32

/** Mirrors the backend's pipeline/mediaPipeline.config.js + media.pricing.js#getPipelineCreditCost.
 * Keep in step with those: the backend charges its own number, this is only the quote shown
 * before submitting. */
const FRAME_IMAGE_USD = 0.0675 // Seedream 5.0 Pro per 1080p frame candidate
const FRAME_CANDIDATES = 2
const VIDEO_RETRY_BUFFER = 1.5

/** USD per unit at a resolution — the model's resolution rate, else its flat usdPerUnit
 * (mirrors the backend's usdPerUnitFor). */
export const usdPerUnitFor = (
  model: MediaCatalogue[string],
  resolution?: VideoResolution | null
): number => (resolution && model.resolutionPricing?.[resolution]) || model.usdPerUnit

/** Resolutions a model offers, low to high; empty when it has no resolution choice. */
export const resolutionsOf = (model: MediaCatalogue[string] | undefined): VideoResolution[] =>
  (["480p", "720p", "1080p"] as const).filter(r => model?.resolutionPricing?.[r] !== undefined)

/** The picked resolution if the model offers it, else 720p, else its lowest. */
export function effectiveResolution(
  model: MediaCatalogue[string] | undefined,
  picked: VideoResolution
): VideoResolution | null {
  const options = resolutionsOf(model)
  if (options.length === 0) return null
  if (options.includes(picked)) return picked
  return options.includes(DEFAULT_RESOLUTION) ? DEFAULT_RESOLUTION : options[0]
}

/** USD → credits, rounded up — after rounding to micro-cents, so float noise can't add a credit
 * (same as the backend's usdToCredits). */
const usdToCredits = (usd: number) => Math.ceil(Number((usd * 100).toFixed(6)))

/**
 * Fixed upfront price of one Auto Video run, in credits (1 credit = 1 cent): the hidden
 * opening-frame candidates (plus closing-frame ones when the end frame is locked), 1.5× the
 * video at the chosen resolution (covers the automatic retry) and the flat subtitle add-on.
 * Pass `includeFrames: false` for a video-only regenerate.
 */
export function estimatePipelineCredits(
  catalogue: MediaCatalogue,
  {
    videoModel,
    durationSeconds,
    resolution = null,
    useEndFrame = false,
    subtitles = false,
    includeFrames = true,
  }: {
    videoModel: string
    durationSeconds: number
    resolution?: VideoResolution | null
    useEndFrame?: boolean
    subtitles?: boolean
    includeFrames?: boolean
  }
): number {
  const video = catalogue[videoModel]
  if (!video) return 0
  const videoUsd =
    usdPerUnitFor(video, resolution) * (video.unit === "second" ? durationSeconds : 1)

  // A (legacy) model that requires an end frame always gets one, as on the backend.
  const endFrame = useEndFrame || video.frameVideo?.endFrame === "required"
  const framesUsd = includeFrames ? FRAME_IMAGE_USD * FRAME_CANDIDATES * (endFrame ? 2 : 1) : 0

  return usdToCredits(framesUsd + videoUsd * VIDEO_RETRY_BUFFER + (subtitles ? SUBTITLES_USD : 0))
}
