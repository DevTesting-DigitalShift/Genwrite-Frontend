import { z } from "zod"
import type { RefinementCtx } from "zod"
import { BLOG_CONFIG } from "@/data/blogConfig"
import { IMAGE_SOURCE } from "@/data/blogData"
import { Language } from "@/types/forms.types"
import { imageSourceWithUploadSchema, languageSchema } from "@/types/forms.schemas"
import { generationOptionsSchema } from "./options"

/**
 * Schema fragments shared by every generation form. A form schema is built by spreading the
 * fragments it needs into `z.object({...})` (or `.extend()`) and calling the `refine*` helpers
 * from one `superRefine`, so a rule such as "a brand voice needs a brand" is written once.
 * Key names follow `models/Blog.js`.
 */

// ---- fragments ---------------------------------------------------------------------------

export const keywordsFragment = {
  keywords: z.array(z.string()),
  focusKeywords: z.array(z.string()).max(BLOG_CONFIG.CONSTRAINTS.MAX_FOCUS_KEYWORDS),
}

export const referenceLinksFragment = {
  referenceLinks: z.array(z.string()).max(BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS),
}

export const imageFragment = {
  imageSource: imageSourceWithUploadSchema,
  numberOfImages: z.number().min(0).max(BLOG_CONFIG.IMAGES.MAX_COUNT),
  /** Browser File-backed entries; only meaningful for the "upload" source. */
  blogImages: z.array(z.any()),
}

export const brandFragment = {
  isCheckedBrand: z.boolean(),
  brandId: z.string().nullable(),
}

export const aiFragment = {
  aiModel: z.string().min(1, "Please select an AI model."),
  costCutter: z.boolean(),
}

export const writingFragment = {
  tone: z.string().min(1, "Please select a tone."),
  userDefinedLength: z.number().min(BLOG_CONFIG.LENGTH.MIN).max(BLOG_CONFIG.LENGTH.MAX),
  languageToWrite: languageSchema,
}

export const postingFragment = {
  /** Which connected integration receives the post; only used while `options.automaticPosting`. */
  postingDefaultType: z.string().nullable(),
}

export const optionsFragment = { options: generationOptionsSchema }

// ---- defaults ----------------------------------------------------------------------------

export const keywordsDefaults = { keywords: [] as string[], focusKeywords: [] as string[] }
export const referenceLinksDefaults = { referenceLinks: [] as string[] }
export const imageDefaults = {
  imageSource: IMAGE_SOURCE.NONE as z.input<typeof imageSourceWithUploadSchema>,
  numberOfImages: 0,
  blogImages: [] as unknown[],
}
export const brandDefaults = { isCheckedBrand: false, brandId: null as string | null }
export const postingDefaults = { postingDefaultType: null as string | null }
export const writingDefaults = {
  userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT,
  languageToWrite: Language.ENGLISH as z.input<typeof languageSchema>,
}

// ---- refinements -------------------------------------------------------------------------

type Ctx = RefinementCtx
const issue = (ctx: Ctx, path: (string | number)[], message: string) =>
  ctx.addIssue({ path, code: "custom", message })

interface KeywordValues {
  keywords: string[]
  focusKeywords: string[]
  options: { performKeywordResearch: boolean }
}

/**
 * Keyword research writes both lists itself, so they are only required while it is off.
 * `focusRequired: false` is for forms that only want secondary keywords (job).
 */
export function refineKeywords(
  values: KeywordValues,
  ctx: Ctx,
  { focusRequired = true }: { focusRequired?: boolean } = {}
) {
  if (values.options.performKeywordResearch) return
  if (focusRequired && values.focusKeywords.length === 0) {
    issue(ctx, ["focusKeywords"], "Please add at least one focus keyword.")
  }
  if (values.keywords.length === 0) {
    issue(ctx, ["keywords"], "Please add at least one keyword.")
  }
}

export function refineBrand(values: { isCheckedBrand: boolean; brandId: string | null }, ctx: Ctx) {
  if (values.isCheckedBrand && !values.brandId) {
    issue(ctx, ["brandId"], "Please select a brand voice.")
  }
}

export function refineImages(
  values: { imageSource: string; blogImages: unknown[] },
  ctx: Ctx
) {
  if (values.imageSource === IMAGE_SOURCE.UPLOAD && values.blogImages.length === 0) {
    issue(ctx, ["blogImages"], "Please upload at least 1 image.")
  }
}

export function refinePosting(
  values: { postingDefaultType: string | null; options: { automaticPosting: boolean } },
  ctx: Ctx
) {
  if (values.options.automaticPosting && !values.postingDefaultType) {
    issue(ctx, ["postingDefaultType"], "Please select a Publishing Platform")
  }
}
