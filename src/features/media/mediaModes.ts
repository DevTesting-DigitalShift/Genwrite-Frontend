import type { PricingCatalogue } from "@api/Pricing/Pricing.api"
import type { MediaModel } from "./mediaOptions"
import { DEFAULT_RESOLUTION, usdPerUnitFor } from "./pipelinePricing"

/** What the user can make. The backend tags every model with one of these (or "internal" for
 * models only its own pipelines call), so the pickers are built from the catalogue, never from a
 * list kept here. */
export type MediaMode = Exclude<MediaModel["mode"], "internal">

export const MEDIA_MODE_LABELS: Record<MediaMode, string> = {
  text_to_image: "Text to image",
  image_to_image: "Image to image",
  text_to_video: "Text to video",
  image_to_video: "Image to video",
  reference_to_video: "Reference to video",
}

export const MEDIA_MODE_HINTS: Record<MediaMode, string> = {
  text_to_image: "Describe the image you want.",
  image_to_image: "Change or restyle an image you upload.",
  text_to_video: "Describe the video you want — it's made straight from your words.",
  image_to_video:
    "We create the opening frame from your description, check it for defects, then animate it with sound.",
  reference_to_video:
    "Add images of your product or app. They're used as references so the video shows the real thing.",
}

/**
 * The modes each tab offers, in order. Image-to-image joins "image" once the backend can run it;
 * until then it would be a mode that can't generate, so it isn't listed.
 */
export const MODES_BY_KIND: Record<"image" | "video", MediaMode[]> = {
  image: ["text_to_image"],
  video: ["text_to_video", "image_to_video", "reference_to_video"],
}

/** Video modes that run through the Auto Video pipeline (frames, quality checks, retries). */
export const isPipelineMode = (mode: MediaMode) =>
  mode === "image_to_video" || mode === "reference_to_video"

/**
 * The models offered for a mode, cheapest first — the first is the default pick, ordered the same
 * way the backend orders them. Models fal no longer serves are left out.
 */
export const modelsForMode = (
  catalogue: PricingCatalogue["media"],
  mode: MediaMode
): MediaModel[] =>
  Object.entries(catalogue)
    .filter(([, model]) => model.mode === mode && !model.unavailable)
    .map(([id, model]) => ({ id, ...model }))
    .sort((a, b) => usdPerUnitFor(a, DEFAULT_RESOLUTION) - usdPerUnitFor(b, DEFAULT_RESOLUTION))

/** The picked model if its mode still offers it, else the mode's cheapest. */
export const resolveModelForMode = (
  catalogue: PricingCatalogue["media"],
  mode: MediaMode,
  modelId: string | null | undefined
): MediaModel | undefined => {
  const models = modelsForMode(catalogue, mode)
  return models.find((m) => m.id === modelId) ?? models[0]
}
