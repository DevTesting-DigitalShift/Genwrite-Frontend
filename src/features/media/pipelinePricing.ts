import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

type MediaCatalogue = PricingCatalogue["media"]
export type AspectRatio = "16:9" | "9:16"

/** Mirrors the backend's pipeline/mediaPipeline.config.js + media.pricing.js#getPipelineCreditCost.
 * Keep in step with those: the backend charges its own number, this is only the quote shown
 * before submitting. */
const FRAME_IMAGE_USD = 0.0675 // Seedream 5.0 Pro per 1080p frame candidate
const FRAME_CANDIDATES = 2
const VIDEO_RETRY_BUFFER = 1.5

/** USD → credits, rounded up — after rounding to micro-cents, so float noise can't add a credit
 * (same as the backend's usdToCredits). */
const usdToCredits = (usd: number) => Math.ceil(Number((usd * 100).toFixed(6)))

/**
 * Fixed upfront price of one Auto Video run, in credits (1 credit = 1 cent): the hidden
 * opening-frame candidates (plus closing-frame ones when the end frame is locked) and 1.5× the
 * video, which covers the automatic retry. Pass `includeFrames: false` for a video-only
 * regenerate.
 */
export function estimatePipelineCredits(
  catalogue: MediaCatalogue,
  {
    videoModel,
    durationSeconds,
    useEndFrame = false,
    includeFrames = true,
  }: {
    videoModel: string
    durationSeconds: number
    useEndFrame?: boolean
    includeFrames?: boolean
  }
): number {
  const video = catalogue[videoModel]
  if (!video) return 0
  const videoUsd = video.usdPerUnit * (video.unit === "second" ? durationSeconds : 1)

  // A (legacy) model that requires an end frame always gets one, as on the backend.
  const endFrame = useEndFrame || video.frameVideo?.endFrame === "required"
  const framesUsd = includeFrames ? FRAME_IMAGE_USD * FRAME_CANDIDATES * (endFrame ? 2 : 1) : 0

  return usdToCredits(framesUsd + videoUsd * VIDEO_RETRY_BUFFER)
}
