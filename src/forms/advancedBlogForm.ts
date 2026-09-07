import { z } from "zod"
import { buildPayload, includeIf } from "@/lib/forms"
import {
  advancedBlogFinalDataSchema,
  imageSourceWithUploadSchema,
  languageSchema,
} from "@/types/forms.schemas"
import { Language } from "@/types/forms.types"
import { AI_MODELS, IMAGE_OPTIONS, IMAGE_SOURCE, TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"

/**
 * Advanced blog modal — form contract.
 *
 * The modal is a four-step wizard, so validation is grouped per step
 * (`ADVANCED_BLOG_STEP_FIELDS`) and every cross-field rule lives in the
 * `superRefine` below rather than in the component. `toAdvancedBlogPayload` is
 * the only place that decides what reaches `/blogs`.
 */

export const advancedBlogOptionsFormSchema = z.object({
  exactTitle: z.boolean(),
  performKeywordResearch: z.boolean(),
  includeFaqs: z.boolean(),
  includeInterlinks: z.boolean(),
  includeCompetitorResearch: z.boolean(),
  addOutBoundLinks: z.boolean(),
  addCTA: z.boolean(),
  easyToUnderstand: z.boolean(),
  embedYouTubeVideos: z.boolean(),
  includeTableOfContents: z.boolean(),
  extendedThinking: z.boolean(),
  deepResearch: z.boolean(),
  humanisation: z.boolean(),
  createBrandedImages: z.boolean(),
})

export const advancedBlogFormSchema = z
  .object({
    template: z.string(),
    topic: z.string(),
    title: z.string(),
    focusKeywords: z.array(z.string()).max(BLOG_CONFIG.CONSTRAINTS.MAX_FOCUS_KEYWORDS),
    keywords: z.array(z.string()),

    tone: z.string().min(1, "Please select a tone"),
    userDefinedLength: z.number().min(BLOG_CONFIG.LENGTH.MIN).max(BLOG_CONFIG.LENGTH.MAX),
    brief: z.string(),
    languageToWrite: languageSchema,
    aiModel: z.string(),
    costCutter: z.boolean(),

    isCheckedGeneratedImages: z.boolean(),
    imageSource: imageSourceWithUploadSchema,
    numberOfImages: z.number().min(0).max(BLOG_CONFIG.IMAGES.MAX_COUNT),
    /** Browser File-backed entries; only meaningful for the "upload" source. */
    blogImages: z.array(z.any()),

    referenceLinks: z.array(z.string()).max(BLOG_CONFIG.CONSTRAINTS.MAX_REFERENCE_LINKS),
    isCheckedQuick: z.boolean(),
    isCheckedBrand: z.boolean(),
    brandId: z.string(),

    wordpressPostStatus: z.boolean(),
    postingType: z.string().nullable(),

    options: advancedBlogOptionsFormSchema,

    // ---- UI-only state: validated here, never sent ----
    /** Selected template cards. The wizard allows exactly one. */
    templateIds: z.array(z.number()),
    /** Opens the fourth "advanced settings" step. */
    enableAdvanced: z.boolean(),
  })
  .superRefine((values, ctx) => {
    // Template errors are reported on `template` because that is where the grid
    // renders them, even though the selection itself is tracked by id.
    if (values.templateIds.length === 0) {
      ctx.addIssue({
        path: ["template"],
        code: "custom",
        message: "Please select a template to continue.",
      })
    } else if (values.templateIds.length > 1) {
      ctx.addIssue({
        path: ["template"],
        code: "custom",
        message: "Please select only 1 template.",
      })
    }

    if (!values.topic.length) {
      ctx.addIssue({ path: ["topic"], code: "custom", message: "Please enter a topic name" })
    }

    // Keyword research generates the title and both keyword lists, so the user
    // only has to supply them while it is off.
    if (!values.options.performKeywordResearch) {
      if (!values.focusKeywords.length) {
        ctx.addIssue({
          path: ["focusKeywords"],
          code: "custom",
          message: "Please enter at least 1 focus keyword",
        })
      }
      if (!values.keywords.length) {
        ctx.addIssue({
          path: ["keywords"],
          code: "custom",
          message: "Please enter at least 1 keyword",
        })
      }
      if (!values.title.length) {
        ctx.addIssue({ path: ["title"], code: "custom", message: "Please enter a title" })
      }
    }

    if (
      values.isCheckedGeneratedImages &&
      values.imageSource === IMAGE_SOURCE.UPLOAD &&
      values.blogImages.length === 0
    ) {
      ctx.addIssue({
        path: ["blogImages"],
        code: "custom",
        message: "Please upload at least 1 image.",
      })
    }

    if (values.wordpressPostStatus && !values.postingType) {
      ctx.addIssue({
        path: ["postingType"],
        code: "custom",
        message: "Please select a Publishing Platform",
      })
    }
  })

export type AdvancedBlogFormValues = z.input<typeof advancedBlogFormSchema>

/** Fields owned by each wizard step, so "Next" only validates what is on screen. */
export const ADVANCED_BLOG_STEP_FIELDS = {
  0: ["template"],
  1: ["topic", "focusKeywords", "keywords", "title"],
  2: ["blogImages"],
  3: ["postingType"],
} as const satisfies Record<number, readonly string[]>

export const advancedBlogFormDefaults: AdvancedBlogFormValues = {
  template: "",
  topic: "",
  title: "",
  focusKeywords: [],
  keywords: [],
  tone: TONES[0],
  userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT,
  brief: "",
  languageToWrite: Language.ENGLISH,
  aiModel: AI_MODELS[0].id,
  costCutter: true,
  isCheckedGeneratedImages: false,
  imageSource: IMAGE_OPTIONS[0].id as AdvancedBlogFormValues["imageSource"],
  numberOfImages: 0,
  blogImages: [],
  referenceLinks: [],
  isCheckedQuick: false,
  isCheckedBrand: false,
  brandId: "",
  wordpressPostStatus: false,
  postingType: null,
  options: {
    exactTitle: false,
    performKeywordResearch: false,
    includeFaqs: false,
    includeInterlinks: false,
    includeCompetitorResearch: false,
    addOutBoundLinks: false,
    addCTA: false,
    easyToUnderstand: false,
    embedYouTubeVideos: false,
    includeTableOfContents: false,
    extendedThinking: false,
    deepResearch: false,
    humanisation: false,
    createBrandedImages: false,
  },
  templateIds: [],
  enableAdvanced: false,
}

/**
 * Form state to request body for POST /blogs.
 *
 * Conditional fields resolve to `undefined` and are then dropped, so the body
 * never carries a brand id for a blog that is not using a brand voice, uploaded
 * images for a blog sourcing stock photos, or a title the backend is about to
 * generate itself.
 */
export function toAdvancedBlogPayload(values: AdvancedBlogFormValues) {
  const usesUploads = values.isCheckedGeneratedImages && values.imageSource === IMAGE_SOURCE.UPLOAD
  const writesOwnKeywords = !values.options.performKeywordResearch

  return buildPayload("AdvancedBlog", advancedBlogFinalDataSchema, {
    template: values.template,
    topic: values.topic,

    // Left to the backend when keyword research is on.
    title: includeIf(writesOwnKeywords, values.title),
    focusKeywords: includeIf(writesOwnKeywords, values.focusKeywords),
    keywords: includeIf(writesOwnKeywords, values.keywords),

    tone: values.tone,
    userDefinedLength: values.userDefinedLength,
    brief: values.brief,
    languageToWrite: values.languageToWrite,
    aiModel: values.aiModel,
    costCutter: values.costCutter,

    isCheckedGeneratedImages: values.isCheckedGeneratedImages,
    imageSource: values.isCheckedGeneratedImages ? values.imageSource : IMAGE_SOURCE.NONE,
    numberOfImages: values.numberOfImages,
    // Uploaded files are sent as multipart by `createBlog`; any other source must
    // not drag a stale file list along with it.
    blogImages: includeIf(usesUploads, values.blogImages),

    referenceLinks: values.referenceLinks,
    isCheckedQuick: values.isCheckedQuick,
    isCheckedBrand: values.isCheckedBrand,
    brandId: includeIf(values.isCheckedBrand, values.brandId),

    wordpressPostStatus: values.wordpressPostStatus,
    postingType: includeIf(values.wordpressPostStatus, values.postingType),

    options: values.options,
  })
}
