import { AI_MODELS, IMAGE_OPTIONS, IMAGE_SOURCE } from "@/data/blogData"
import type { GenerationCostBreakdown } from "./cost"

/**
 * Plain-language values for the create forms' summary rail, so every form words "which model",
 * "what images" and "how many switches" the same way.
 */

const MODEL_LABEL: Record<string, string> = Object.fromEntries(
  AI_MODELS.map((m) => [m.id, m.label])
)
const IMAGE_LABEL: Record<string, string> = Object.fromEntries(
  IMAGE_OPTIONS.map((o) => [o.id, o.label])
)

/** "Gemini · Cost cutter" / "ChatGPT". */
export function modelSummary(aiModel: string | undefined, costCutter: boolean | undefined) {
  const model = (aiModel && MODEL_LABEL[aiModel]) || aiModel || "Not selected"
  return costCutter ? `${model} · Cost cutter` : model
}

/** "Off" / "3 · Stock" / "Auto · AI" / "2 uploaded". */
export function imagesSummary(values: {
  imageSource?: string
  numberOfImages?: number | ""
  blogImages?: unknown[]
}) {
  if (!values.imageSource || values.imageSource === IMAGE_SOURCE.NONE) return "Off"
  if (values.imageSource === IMAGE_SOURCE.UPLOAD)
    return `${values.blogImages?.length ?? 0} uploaded`
  const source = IMAGE_LABEL[values.imageSource] ?? values.imageSource
  // 0 is "let the AI decide how many" (see ImageSourceSelector), not "none".
  return `${Number(values.numberOfImages) || "Auto"} · ${source}`
}

/** Collapsed "AI & images" header chip: "Gemini · Cost cutter · Images off". */
export function aiSectionSummary(values: {
  aiModel?: string
  costCutter?: boolean
  imageSource?: string
  numberOfImages?: number | ""
  blogImages?: unknown[]
}) {
  const images = imagesSummary(values)
  return `${modelSummary(values.aiModel, values.costCutter)} · ${images === "Off" ? "Images off" : `Images ${images}`}`
}

/** "3 focus · 5 secondary", or who's choosing them when keyword research is on. */
export function keywordsSummary(
  values: { focusKeywords?: string[]; keywords?: string[] },
  researching: boolean | undefined
) {
  if (researching) return "AI keyword research"
  const focus = values.focusKeywords?.length ?? 0
  const secondary = values.keywords?.length ?? 0
  if (values.focusKeywords === undefined) return secondary ? `${secondary} added` : "None yet"
  return `${focus} focus · ${secondary} secondary`
}

/** Counts how many of the given toggles are on. */
export const countEnabled = (flags: unknown[]) => flags.filter(Boolean).length

/** Pre-cost-cutter price, or `undefined` when the cutter is off (nothing to strike through). */
export const originalCostOf = (cost: GenerationCostBreakdown) =>
  cost.costCutter ? Math.round(cost.subtotal) : undefined

/** "1 item" / "3 items". */
export const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`
