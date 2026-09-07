import { z } from "zod"
import { buildPayload, includeIf } from "@/lib/forms"
import { imageSourceSchema, regenerateBlogSchema } from "@/types/forms.schemas"
import { DEFAULT_IMAGE_SOURCE, IMAGE_SOURCE } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"

/**
 * Regenerate-blog modal — form contract.
 *
 * The modal is rendered by the editor sidebar, which owns the state; this module
 * owns what that state must look like and what a regeneration request contains.
 */

export const regenerateBlogOptionsFormSchema = z.object({
  includeFaqs: z.boolean(),
  includeInterlinks: z.boolean(),
  includeCompetitorResearch: z.boolean(),
  addOutBoundLinks: z.boolean(),
  performKeywordResearch: z.boolean(),
  humanisation: z.boolean(),
  extendedThinking: z.boolean(),
  deepResearch: z.boolean(),
  easyToUnderstand: z.boolean(),
  embedYouTubeVideos: z.boolean(),
  automaticPosting: z.boolean(),
  includeTableOfContents: z.boolean(),
  addCTA: z.boolean(),
  createBrandedImages: z.boolean(),
})

/** Mongo ObjectId, the shape the backend accepts for a brand reference. */
const OBJECT_ID = /^[a-fA-F0-9]{24}$/

export const regenerateBlogFormSchema = z
  .object({
    topic: z.string().min(1, "Topic is required"),
    title: z.string(),
    focusKeywords: z.array(z.string()).max(3),
    keywords: z.array(z.string()),

    tone: z.string().min(1, "Tone is required"),
    userDefinedLength: z.number().min(BLOG_CONFIG.LENGTH.MIN).max(BLOG_CONFIG.LENGTH.MAX),
    aiModel: z.string(),
    costCutter: z.boolean(),
    isCheckedQuick: z.boolean(),

    isCheckedGeneratedImages: z.boolean(),
    imageSource: imageSourceSchema,
    numberOfImages: z.number().min(0).max(BLOG_CONFIG.IMAGES.MAX_COUNT),

    isCheckedBrand: z.boolean(),
    brandId: z.string().nullable(),

    postingDefaultType: z.string().nullable(),

    options: regenerateBlogOptionsFormSchema,
  })
  .superRefine((values, ctx) => {
    if (values.options.automaticPosting && !values.postingDefaultType) {
      ctx.addIssue({
        path: ["postingDefaultType"],
        code: "custom",
        message: "Posting default type is required when automatic posting is enabled",
      })
    }

    if (values.isCheckedBrand && !OBJECT_ID.test(values.brandId?.trim() ?? "")) {
      ctx.addIssue({
        path: ["brandId"],
        code: "custom",
        message: "A valid Brand ID is required when using brand voice",
      })
    }
  })

export type RegenerateBlogFormValues = z.input<typeof regenerateBlogFormSchema>

export const regenerateBlogFormDefaults: RegenerateBlogFormValues = {
  topic: "",
  title: "",
  focusKeywords: [],
  keywords: [],
  tone: "Professional",
  userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT,
  aiModel: "gemini",
  costCutter: false,
  isCheckedQuick: false,
  isCheckedGeneratedImages: false,
  imageSource: DEFAULT_IMAGE_SOURCE as RegenerateBlogFormValues["imageSource"],
  numberOfImages: 0,
  isCheckedBrand: false,
  brandId: "",
  postingDefaultType: null,
  options: {
    includeFaqs: false,
    includeInterlinks: false,
    includeCompetitorResearch: false,
    addOutBoundLinks: false,
    performKeywordResearch: false,
    humanisation: false,
    extendedThinking: false,
    deepResearch: false,
    easyToUnderstand: false,
    embedYouTubeVideos: false,
    automaticPosting: false,
    includeTableOfContents: false,
    addCTA: false,
    createBrandedImages: false,
  },
}

/**
 * Form state to request body for POST /blogs/:id/retry.
 *
 * `createNew` is always true here — this modal only exists to rebuild a post from
 * scratch. The word count is rounded to the nearest 500 because that is the grid
 * the credit estimate and the backend both work on.
 */
export function toRegenerateBlogPayload(values: RegenerateBlogFormValues) {
  const writesOwnKeywords = !values.options.performKeywordResearch

  return buildPayload("RegenerateBlog", regenerateBlogSchema, {
    createNew: true,
    topic: values.topic,
    tone: values.tone,
    userDefinedLength: Math.max(
      BLOG_CONFIG.LENGTH.MIN,
      Math.round((values.userDefinedLength || BLOG_CONFIG.LENGTH.DEFAULT) / 500) * 500
    ),
    aiModel: values.aiModel,
    costCutter: values.costCutter,
    isCheckedQuick: values.isCheckedQuick,

    // Left to the backend when keyword research is on.
    title: includeIf(writesOwnKeywords, values.title),
    focusKeywords: includeIf(writesOwnKeywords, values.focusKeywords),
    keywords: includeIf(writesOwnKeywords, values.keywords),

    isCheckedGeneratedImages: values.isCheckedGeneratedImages,
    imageSource: values.isCheckedGeneratedImages ? values.imageSource : IMAGE_SOURCE.NONE,
    numberOfImages: values.isCheckedGeneratedImages ? values.numberOfImages || 0 : 0,

    isCheckedBrand: values.isCheckedBrand,
    brandId: includeIf(values.isCheckedBrand && values.brandId, values.brandId),

    postingDefaultType: includeIf(
      values.options.automaticPosting && values.postingDefaultType,
      values.postingDefaultType
    ),

    options: values.options,
  })
}
