import type { MediaModel } from "./mediaOptions"

type ImageOptions = NonNullable<MediaModel["imageOptions"]>

/** What the user has picked; anything left out (or no longer valid for the model) is its default. */
export type ImageChoice = { aspectRatio?: string; resolution?: string; quality?: string | null }

export type ResolvedImageChoice = {
  aspectRatio: string
  resolution: string
  quality: string | null
}

/** Looks like the backend's variantKey: `aspectRatio|resolution|quality` ("" when none). */
export const imageKey = (c: ResolvedImageChoice) =>
  `${c.aspectRatio}|${c.resolution}|${c.quality ?? ""}`

const pick = (value: string | undefined | null, allowed: string[], fallback: string) =>
  value && allowed.includes(value) ? value : fallback

/**
 * The model's options with a pick applied: a pick the model doesn't offer (the user switched from
 * a model that had it) falls back to that model's default, so the form can never hold a combination
 * the model can't run.
 */
export function resolveImageChoice(
  options: ImageOptions,
  choice: ImageChoice = {}
): ResolvedImageChoice {
  return {
    aspectRatio: pick(choice.aspectRatio, options.aspectRatios, options.defaults.aspectRatio),
    resolution: pick(choice.resolution, options.resolutions, options.defaults.resolution),
    quality: options.qualities
      ? pick(choice.quality, options.qualities, options.defaults.quality ?? options.qualities[0])
      : null,
  }
}

/** USD for a combination, straight from the backend's table (null if it isn't listed). */
export const imageUsd = (options: ImageOptions, choice: ResolvedImageChoice): number | null =>
  options.usd[imageKey(choice)] ?? null

/** USD → credits (1 credit = 1 cent), rounded up after rounding to micro-cents, like the backend. */
export const usdToCredits = (usd: number) => Math.ceil(Number((usd * 100).toFixed(6)))

/** Credits for a combination, or null when the model has no options / the combination isn't priced. */
export function imageCredits(
  model: MediaModel | undefined,
  choice: ImageChoice = {}
): number | null {
  if (!model?.imageOptions) return null
  const usd = imageUsd(model.imageOptions, resolveImageChoice(model.imageOptions, choice))
  return usd === null ? null : usdToCredits(usd)
}

/** The cheapest credits any combination of the model costs — "from N credits" in a model list. */
export function cheapestImageCredits(model: MediaModel): number | null {
  const prices = Object.values(model.imageOptions?.usd ?? {})
  return prices.length ? usdToCredits(Math.min(...prices)) : null
}

/** "1:1" → "Square 1:1" style labels for the aspect-ratio list. */
const ASPECT_LABELS: Record<string, string> = {
  "1:1": "Square",
  "4:3": "Landscape",
  "3:4": "Portrait",
  "3:2": "Landscape",
  "2:3": "Portrait",
  "16:9": "Widescreen",
  "9:16": "Vertical",
  "21:9": "Ultrawide",
  match: "Match input",
}
export const aspectLabel = (id: string) => {
  const name = ASPECT_LABELS[id]
  return id === "match" ? "Match input" : name ? `${name} ${id}` : id
}

export const RESOLUTION_LABELS: Record<string, string> = { "1k": "1K", "2k": "2K" }
export const resolutionLabel = (id: string) => RESOLUTION_LABELS[id] ?? id.toUpperCase()

export const QUALITY_LABELS: Record<string, string> = { low: "Low", medium: "Medium", high: "High" }
export const qualityLabel = (id: string) => QUALITY_LABELS[id] ?? id
