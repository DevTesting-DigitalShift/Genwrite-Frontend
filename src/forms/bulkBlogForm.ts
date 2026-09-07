import { z } from "zod"
import { buildPayload, includeIf } from "@/lib/forms"
import { bulkBlogFinalDataSchema, imageSourceSchema, languageSchema } from "@/types/forms.schemas"
import { Language } from "@/types/forms.types"
import { IMAGE_SOURCE, TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"

/**
 * Bulk ("multiple blogs") modal — form contract.
 *
 * Number inputs in this modal are allowed to sit empty while the user retypes
 * them, so the numeric fields accept `""` and the range rules live in the
 * `superRefine` where they can carry the exact copy the modal already showed.
 * `toBulkBlogPayload` coerces them back to numbers on the way out.
 */

export const BULK_MAX_TEMPLATES = 3

/** A number field that may be temporarily blank while being edited. */
const editableNumber = z.union([z.number(), z.literal("")])

export const bulkBlogFormSchema = z
  .object({
    templates: z.array(z.string()),
    topics: z.array(z.string()),
    keywords: z.array(z.string()),

    performKeywordResearch: z.boolean(),
    tone: z.string().min(1, "Please select a tone."),
    languageToWrite: languageSchema,
    userDefinedLength: z.number().min(BLOG_CONFIG.LENGTH.MIN).max(BLOG_CONFIG.LENGTH.MAX),
    aiModel: z.string().min(1, "Please select an AI model."),
    costCutter: z.boolean(),

    numberOfBlogs: editableNumber,
    numberOfImages: editableNumber,

    isCheckedGeneratedImages: z.boolean(),
    imageSource: imageSourceSchema,
    /** Reserved for a future upload source; this modal only offers stock/AI today. */
    blogImages: z.array(z.any()),

    isCheckedBrand: z.boolean(),
    brandId: z.string().nullable(),

    includeCompetitorResearch: z.boolean(),
    includeInterlinks: z.boolean(),
    includeFaqs: z.boolean(),
    includeTableOfContents: z.boolean(),
    addOutBoundLinks: z.boolean(),
    addCTA: z.boolean(),
    easyToUnderstand: z.boolean(),
    embedYouTubeVideos: z.boolean(),
    extendedThinking: z.boolean(),
    deepResearch: z.boolean(),
    humanisation: z.boolean(),
    createBrandedImages: z.boolean(),

    wordpressPostStatus: z.boolean(),
    postingType: z.string().nullable(),

    // ---- UI-only state: validated here, never sent ----
    templateIds: z.array(z.number()),
    topicInput: z.string(),
    keywordInput: z.string(),
    isDragging: z.boolean(),
    enableAdvanced: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.templates.length === 0) {
      ctx.addIssue({
        path: ["templates"],
        code: "custom",
        message: "Please select at least one template.",
      })
    } else if (values.templates.length > BULK_MAX_TEMPLATES) {
      ctx.addIssue({
        path: ["templates"],
        code: "custom",
        message: `Maximum of ${BULK_MAX_TEMPLATES} templates can be selected.`,
      })
    }

    const blogs = values.numberOfBlogs === "" ? Number.NaN : values.numberOfBlogs
    if (Number.isNaN(blogs) || blogs < 1) {
      ctx.addIssue({
        path: ["numberOfBlogs"],
        code: "custom",
        message: "Number of blogs must be at least 1.",
      })
    } else if (blogs > BLOG_CONFIG.BULK.MAX_BLOGS) {
      ctx.addIssue({
        path: ["numberOfBlogs"],
        code: "custom",
        message: `Number of blogs cannot exceed ${BLOG_CONFIG.BULK.MAX_BLOGS}.`,
      })
    }

    // One topic per blog: the backend generates exactly `numberOfBlogs` posts and
    // pairs each with a topic, so a mismatch would silently drop or repeat one.
    if (values.topics.length === 0 && values.topicInput.trim() === "") {
      ctx.addIssue({
        path: ["topics"],
        code: "custom",
        message: "Please add at least one topic.",
      })
    } else if (values.topics.length !== blogs) {
      ctx.addIssue({
        path: ["topics"],
        code: "custom",
        message: `Please add exactly ${values.numberOfBlogs} topics (currently ${values.topics.length} added).`,
      })
    }

    if (
      !values.performKeywordResearch &&
      values.keywords.length === 0 &&
      values.keywordInput.trim() === ""
    ) {
      ctx.addIssue({
        path: ["keywords"],
        code: "custom",
        message: "Please add at least one keyword.",
      })
    }

    const images = values.numberOfImages === "" ? Number.NaN : values.numberOfImages
    if (Number.isNaN(images) || images < 0 || images > BLOG_CONFIG.IMAGES.MAX_COUNT) {
      ctx.addIssue({
        path: ["numberOfImages"],
        code: "custom",
        message: `Number of images must be between 0 and ${BLOG_CONFIG.IMAGES.MAX_COUNT}.`,
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

export type BulkBlogFormValues = z.input<typeof bulkBlogFormSchema>

/** Fields owned by each wizard step, so "Next" only validates what is on screen. */
export const BULK_BLOG_STEP_FIELDS = {
  0: ["templates"],
  1: ["topics", "keywords", "numberOfBlogs"],
  2: ["numberOfImages", "blogImages"],
  3: ["aiModel", "postingType"],
} as const satisfies Record<number, readonly string[]>

/** The step a field belongs to, so a failed submit lands on the right screen. */
export function bulkStepOfField(name: string): number {
  const entry = Object.entries(BULK_BLOG_STEP_FIELDS).find(([, fields]) =>
    (fields as readonly string[]).includes(name)
  )
  return entry ? Number(entry[0]) : 1
}

export const bulkBlogFormDefaults: BulkBlogFormValues = {
  templates: [],
  topics: [],
  keywords: [],
  performKeywordResearch: true,
  tone: TONES[0],
  languageToWrite: Language.ENGLISH,
  userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT,
  aiModel: "gemini",
  costCutter: true,
  numberOfBlogs: 1,
  numberOfImages: 0,
  isCheckedGeneratedImages: true,
  imageSource: IMAGE_SOURCE.STOCK as BulkBlogFormValues["imageSource"],
  blogImages: [],
  isCheckedBrand: false,
  brandId: null,
  includeCompetitorResearch: false,
  includeInterlinks: false,
  includeFaqs: false,
  includeTableOfContents: false,
  addOutBoundLinks: false,
  addCTA: false,
  easyToUnderstand: false,
  embedYouTubeVideos: false,
  extendedThinking: false,
  deepResearch: false,
  humanisation: false,
  createBrandedImages: false,
  wordpressPostStatus: false,
  postingType: null,
  templateIds: [],
  topicInput: "",
  keywordInput: "",
  isDragging: false,
  enableAdvanced: false,
}

/**
 * Form state to request body for POST /blogs/xyz.
 *
 * `includeCompetitorResearch` is the UI's name for what the endpoint calls
 * `useCompetitors` — mapping it here is what makes the toggle actually reach the
 * backend. `postFrequency` is not collected by the modal at all; the payload
 * schema supplies its default.
 */
export function toBulkBlogPayload(values: BulkBlogFormValues) {
  const numberOfBlogs = values.numberOfBlogs === "" ? 1 : values.numberOfBlogs
  const numberOfImages = values.numberOfImages === "" ? 0 : values.numberOfImages

  return buildPayload("BulkBlog", bulkBlogFinalDataSchema, {
    templates: values.templates,
    topics: values.topics,
    keywords: values.keywords,

    performKeywordResearch: values.performKeywordResearch,
    tone: values.tone,
    languageToWrite: values.languageToWrite,
    userDefinedLength: values.userDefinedLength,
    aiModel: values.aiModel,
    costCutter: values.costCutter,

    numberOfBlogs,
    numberOfImages,

    isCheckedGeneratedImages: values.isCheckedGeneratedImages,
    imageSource: values.isCheckedGeneratedImages ? values.imageSource : IMAGE_SOURCE.NONE,
    // The modal has no upload source today, so this stays absent rather than
    // shipping an empty array on every request.
    blogImages: includeIf(values.blogImages.length > 0, values.blogImages),

    isCheckedBrand: values.isCheckedBrand,
    brandId: includeIf(values.isCheckedBrand, values.brandId),

    useCompetitors: values.includeCompetitorResearch,
    includeInterlinks: values.includeInterlinks,
    includeFaqs: values.includeFaqs,
    includeTableOfContents: values.includeTableOfContents,
    addOutBoundLinks: values.addOutBoundLinks,
    addCTA: values.addCTA,
    easyToUnderstand: values.easyToUnderstand,
    embedYouTubeVideos: values.embedYouTubeVideos,
    extendedThinking: values.extendedThinking,
    deepResearch: values.deepResearch,
    humanisation: values.humanisation,
    createBrandedImages: values.createBrandedImages,

    wordpressPostStatus: values.wordpressPostStatus,
    postingType: includeIf(values.wordpressPostStatus, values.postingType),
  })
}
