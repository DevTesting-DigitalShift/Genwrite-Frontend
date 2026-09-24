import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

type MediaCatalogue = PricingCatalogue["media"]
export type AspectRatio = "16:9" | "9:16"

/** Mirrors the backend's pipeline/mediaPipeline.config.js + media.pricing.js#getPipelineCreditCost.
 * Keep in step with those: the backend charges its own number, this is only the quote shown
 * before submitting. */
const FIRST_FRAME_MODEL = "fal-ai/hidream-o1-image"
const FRAME_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
}
const FRAME_CANDIDATES = 2
const VIDEO_RETRY_BUFFER = 1.5

/**
 * Fixed upfront price of one Auto Video run, in credits (1 credit = 1 cent): the hidden
 * first/last-frame candidates plus 1.5× the video, which covers the automatic retry. Pass
 * `includeFrames: false` for a video-only regenerate.
 */
export function estimatePipelineCredits(
  catalogue: MediaCatalogue,
  {
    videoModel,
    durationSeconds,
    aspectRatio = "16:9",
    includeFrames = true,
  }: {
    videoModel: string
    durationSeconds: number
    aspectRatio?: AspectRatio
    includeFrames?: boolean
  }
): number {
  const video = catalogue[videoModel]
  if (!video) return 0
  const videoUsd = video.usdPerUnit * (video.unit === "second" ? durationSeconds : 1)

  let framesUsd = 0
  const frameModel = catalogue[FIRST_FRAME_MODEL]
  if (includeFrames && frameModel) {
    const { width, height } = FRAME_SIZES[aspectRatio]
    framesUsd = frameModel.usdPerUnit * ((width * height) / 1_000_000) * FRAME_CANDIDATES * 2
  }

  return Math.ceil((framesUsd + videoUsd * VIDEO_RETRY_BUFFER) * 100)
}
