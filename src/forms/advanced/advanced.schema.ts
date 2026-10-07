import { z } from "zod"
import { buildPayload, includeIf } from "@/lib/forms"
import { advancedBlogFinalDataSchema } from "@/types/forms.schemas"
import { AI_MODELS, IMAGE_SOURCE, TONES } from "@/data/blogData"
import {
  aiFragment,
  brandDefaults,
  brandFragment,
  imageDefaults,
  imageFragment,
  keywordsDefaults,
  keywordsFragment,
  optionsFragment,
  postingDefaults,
  postingFragment,
  referenceLinksDefaults,
  referenceLinksFragment,
  refineBrand,
  refineImages,
  refineKeywords,
  refinePosting,
  writingDefaults,
  writingFragment,
} from "../shared/fragments"
import { generationOptionDefaults } from "../shared/options"
import { resolveCreateBrandedImages } from "../shared/payload"
import { validateLink } from "../shared/links"

/**
 * Advanced blog form (POST /blogs). Every shared rule — keywords, images, brand, posting —
 * comes from `../shared/fragments`; this file only adds what is specific to the advanced
 * blog: the template, topic, title and brief, and the quick-summary switch.
 */

export const advancedBlogFormSchema = z
  .object({
    template: z.string().nullable(),
    topic: z.string().trim().min(1, "Please enter a topic name"),
    title: z.string(),
    brief: z.string(),

    ...keywordsFragment,
    ...referenceLinksFragment,
    ...writingFragment,
    ...aiFragment,
    ...imageFragment,
    ...brandFragment,
    ...postingFragment,
    ...optionsFragment,
    isCheckedQuick: z.boolean(),

    // ---- form-only: validated here, never sent ----
    templateIds: z.array(z.number()),
  })
  .superRefine((values, ctx) => {
    if (!values.template?.trim()) {
      ctx.addIssue({
        path: ["template"],
        code: "custom",
        message: "Please select a template to continue.",
      })
    }

    // Keyword research generates the title and both keyword lists, so the user only has to
    // supply them while it is off.
    refineKeywords(values, ctx)
    if (!values.options.performKeywordResearch && !values.title.trim()) {
      ctx.addIssue({ path: ["title"], code: "custom", message: "Please enter a title" })
    }

    values.referenceLinks.forEach((link, index) => {
      const problem = validateLink(link, "reference")
      if (problem) ctx.addIssue({ path: ["referenceLinks", index], code: "custom", message: problem })
    })

    refineImages(values, ctx)
    refineBrand(values, ctx)
    refinePosting(values, ctx)
  })

export type AdvancedBlogFormValues = z.input<typeof advancedBlogFormSchema>

export const advancedBlogFormDefaults: AdvancedBlogFormValues = {
  template: null,
  topic: "",
  title: "",
  brief: "",
  ...keywordsDefaults,
  ...referenceLinksDefaults,
  tone: TONES[0],
  ...writingDefaults,
  aiModel: AI_MODELS[0].id,
  costCutter: true,
  ...imageDefaults,
  ...brandDefaults,
  ...postingDefaults,
  options: generationOptionDefaults(),
  isCheckedQuick: false,
  templateIds: [],
}

/**
 * Form state → request body for POST /blogs.
 *
 * Conditional fields resolve to `undefined` and are then dropped, so the body never carries
 * a brand id for a blog that is not using a brand voice, uploaded images for a blog sourcing
 * stock photos, or a title the backend is about to generate itself.
 */
export function toAdvancedBlogPayload(values: AdvancedBlogFormValues) {
  const imagesOn = values.imageSource !== IMAGE_SOURCE.NONE
  const usesUploads = values.imageSource === IMAGE_SOURCE.UPLOAD
  const writesOwnKeywords = !values.options.performKeywordResearch

  return buildPayload("AdvancedBlog", advancedBlogFinalDataSchema, {
    template: values.template,
    topic: values.topic.trim(),

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

    imageSource: values.imageSource,
    numberOfImages: imagesOn ? values.numberOfImages : 0,
    // Uploaded files travel as multipart (see `BlogAPI.create`); any other source must not
    // drag a stale file list along with it.
    blogImages: includeIf(usesUploads, values.blogImages),

    referenceLinks: values.referenceLinks,
    isCheckedQuick: values.isCheckedQuick,
    isCheckedBrand: values.isCheckedBrand,
    brandId: includeIf(values.isCheckedBrand, values.brandId),

    postingDefaultType: includeIf(values.options.automaticPosting, values.postingDefaultType),

    options: {
      ...values.options,
      createBrandedImages: resolveCreateBrandedImages(values),
    },
  })
}
