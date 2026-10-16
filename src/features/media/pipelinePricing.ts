import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

type MediaCatalogue = PricingCatalogue["media"]
export type AspectRatio = "16:9" | "9:16"
export type VideoResolution = "480p" | "540p" | "720p" | "1080p"

/** What the backend uses when no resolution is picked (DEFAULT_VIDEO_RESOLUTION). */
export const DEFAULT_RESOLUTION: VideoResolution = "720p"

/** The fal models whose rates make up a run's price besides the video model itself — read from
 * the live catalogue only. If the catalogue doesn't list one, the price is unknown and the
 * estimate is null; a made-up number would just be a wrong quote. */
const FRAME_MODEL = "bytedance/seedream/v5/pro/edit"
const SUBTITLE_MODELS = ["fal-ai/elevenlabs/forced-alignment", "veed/subtitles"] as const

/** Mirrors the backend's pipeline/mediaPipeline.config.js + media.pricing.js#getPipelineCreditCost.
 * Keep in step with those: the backend charges its own number, this is only the quote shown
 * before submitting. */
const FRAME_CANDIDATES = 2
/** Each product screenshot after the first adds this share of a frame's price per opening-frame
 * candidate (backend: EXTRA_REFERENCE_IMAGE_RATIO — $0.0045 on a $0.0675 frame). */
const EXTRA_REFERENCE_IMAGE_RATIO = 1 / 15
const VIDEO_RETRY_BUFFER = 1.5

/** USD per unit at a resolution — the model's resolution rate, else its flat usdPerUnit
 * (mirrors the backend's usdPerUnitFor). */
export const usdPerUnitFor = (
  model: MediaCatalogue[string],
  resolution?: VideoResolution | null
): number => (resolution && model.resolutionPricing?.[resolution]) || model.usdPerUnit

/** Resolutions a model offers, low to high; empty when it has no resolution choice. */
export const resolutionsOf = (model: MediaCatalogue[string] | undefined): VideoResolution[] =>
  (["480p", "540p", "720p", "1080p"] as const).filter(
    (r) => model?.resolutionPricing?.[r] !== undefined
  )

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
 *
 * Returns null when the catalogue lacks a rate the run needs — never a guess.
 */
export function estimatePipelineCredits(
  catalogue: MediaCatalogue,
  {
    videoModel,
    durationSeconds,
    resolution = null,
    useEndFrame = false,
    subtitles = false,
    productImages = 0,
    includeFrames = true,
  }: {
    videoModel: string
    durationSeconds: number
    resolution?: VideoResolution | null
    useEndFrame?: boolean
    subtitles?: boolean
    productImages?: number
    includeFrames?: boolean
  }
): number | null {
  const video = catalogue[videoModel]
  const frame = catalogue[FRAME_MODEL]
  if (!video || (includeFrames && !frame)) return null
  if (subtitles && !SUBTITLE_MODELS.every((id) => catalogue[id])) return null

  const videoUsd =
    usdPerUnitFor(video, resolution) * (video.unit === "second" ? durationSeconds : 1)

  const frameUsd = frame?.usdPerUnit ?? 0
  const productFeeUsd =
    Math.max(0, productImages - 1) * frameUsd * EXTRA_REFERENCE_IMAGE_RATIO * FRAME_CANDIDATES
  const framesUsd = includeFrames
    ? frameUsd * FRAME_CANDIDATES * (useEndFrame ? 2 : 1) + productFeeUsd
    : 0
  const subtitlesUsd = subtitles
    ? SUBTITLE_MODELS.reduce((sum, id) => sum + catalogue[id].usdPerUnit, 0)
    : 0

  return usdToCredits(framesUsd + videoUsd * VIDEO_RETRY_BUFFER + subtitlesUsd)
}
