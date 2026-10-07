import { z } from "zod"
import { buildPayload, includeIf } from "@/lib/forms"
import { bulkBlogFinalDataSchema, imageSourceSchema } from "@/types/forms.schemas"
import { IMAGE_SOURCE, TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import {
  aiFragment,
  brandDefaults,
  brandFragment,
  keywordsFragment,
  optionsFragment,
  postingDefaults,
  postingFragment,
  refineBrand,
  refineKeywords,
  refinePosting,
  writingDefaults,
  writingFragment,
} from "../shared/fragments"
import { generationOptionDefaults } from "../shared/options"
import { resolveCreateBrandedImages } from "../shared/payload"

/**
 * Bulk ("multiple blogs") form. The number of blogs and the topic list are paired 1:1 by the
 * backend, so the rules for both live here beside the shared fragments.
 */

export const BULK_MAX_TEMPLATES = 3

export const bulkBlogFormSchema = z
  .object({
    templates: z.array(z.string()),
    topics: z.array(z.string()),
    /** `undefined` while the box is empty; the range rule reports it with the usual copy. */
    numberOfBlogs: z.number({ error: `Number of blogs must be at least ${BLOG_CONFIG.BULK.MIN_BLOGS}.` }),

    // Bulk has no focus keywords and no upload source.
    keywords: keywordsFragment.keywords,
    ...writingFragment,
    ...aiFragment,
    imageSource: imageSourceSchema,
    numberOfImages: z.number({ error: "Number of images must be a number." }).min(0).max(BLOG_CONFIG.IMAGES.MAX_COUNT),
    ...brandFragment,
    ...postingFragment,
    ...optionsFragment,

    // ---- form-only: validated here, never sent ----
    templateIds: z.array(z.number()),
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

    const blogs = values.numberOfBlogs
    const { MIN_BLOGS, MAX_BLOGS } = BLOG_CONFIG.BULK
    if (blogs < MIN_BLOGS) {
      ctx.addIssue({
        path: ["numberOfBlogs"],
        code: "custom",
        message: `Number of blogs must be at least ${MIN_BLOGS}.`,
      })
    } else if (blogs > MAX_BLOGS) {
      ctx.addIssue({
        path: ["numberOfBlogs"],
        code: "custom",
        message: `Number of blogs cannot exceed ${MAX_BLOGS}.`,
      })
    }

    // One topic per blog: the backend generates exactly `numberOfBlogs` posts and pairs each
    // with a topic, so a mismatch would silently drop or repeat one.
    const topicCount = values.topics.length
    if (topicCount < MIN_BLOGS) {
      ctx.addIssue({
        path: ["topics"],
        code: "custom",
        message: `Please add at least ${MIN_BLOGS} topics (currently ${topicCount} added).`,
      })
    } else if (topicCount > MAX_BLOGS) {
      ctx.addIssue({
        path: ["topics"],
        code: "custom",
        message: `You can add at most ${MAX_BLOGS} topics.`,
      })
    } else if (topicCount !== blogs) {
      ctx.addIssue({
        path: ["topics"],
        code: "custom",
        message: `Please add exactly ${blogs} topics (currently ${topicCount} added).`,
      })
    }

    refineKeywords({ ...values, focusKeywords: [] }, ctx, { focusRequired: false })
    refineBrand(values, ctx)
    refinePosting(values, ctx)
  })

export type BulkBlogFormValues = z.input<typeof bulkBlogFormSchema>

export const bulkBlogFormDefaults: BulkBlogFormValues = {
  templates: [],
  topics: [],
  numberOfBlogs: BLOG_CONFIG.BULK.MIN_BLOGS,
  keywords: [],
  tone: TONES[0],
  ...writingDefaults,
  aiModel: "gemini",
  costCutter: true,
  imageSource: IMAGE_SOURCE.STOCK as BulkBlogFormValues["imageSource"],
  numberOfImages: 0,
  ...brandDefaults,
  ...postingDefaults,
  options: generationOptionDefaults({ performKeywordResearch: true }),
  templateIds: [],
}

/**
 * Raises the blog count to the number of topics (never lowers it), since the two are paired
 * 1:1. Returns the new count, or `null` when nothing needs to change.
 */
export function blogCountForTopics(topicCount: number, currentCount: number | undefined) {
  if (topicCount <= (currentCount ?? 0)) return null
  return Math.min(topicCount, BLOG_CONFIG.BULK.MAX_BLOGS)
}

/** Form state → request body for POST /blogs/xyz. */
export function toBulkBlogPayload(values: BulkBlogFormValues) {
  const imagesOn = values.imageSource !== IMAGE_SOURCE.NONE
  return buildPayload("BulkBlog", bulkBlogFinalDataSchema, {
    templates: values.templates,
    topics: values.topics,
    keywords: values.keywords,

    tone: values.tone,
    languageToWrite: values.languageToWrite,
    userDefinedLength: values.userDefinedLength,
    aiModel: values.aiModel,
    costCutter: values.costCutter,

    numberOfBlogs: values.numberOfBlogs,
    imageSource: values.imageSource,
    numberOfImages: imagesOn ? values.numberOfImages : 0,

    isCheckedBrand: values.isCheckedBrand,
    brandId: includeIf(values.isCheckedBrand, values.brandId),
    postingDefaultType: includeIf(values.options.automaticPosting, values.postingDefaultType),

    options: {
      ...values.options,
      createBrandedImages: resolveCreateBrandedImages(values),
    },
  })
}
