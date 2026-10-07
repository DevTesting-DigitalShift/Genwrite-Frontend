import { z } from "zod"
import { buildPayload } from "@/lib/forms"
import { imageSourceSchema, languageSchema, quickBlogFinalDataSchema } from "@/types/forms.schemas"
import { Language } from "@/types/forms.types"
import { AI_MODELS, IMAGE_SOURCE } from "@/data/blogData"
import {
  aiFragment,
  imageDefaults,
  keywordsDefaults,
  keywordsFragment,
  optionsFragment,
  referenceLinksDefaults,
  referenceLinksFragment,
  refineKeywords,
} from "../shared/fragments"
import { generationOptionDefaults, type GenerationOptions } from "../shared/options"
import { validateLink } from "../shared/links"

/**
 * Quick / YouTube blog form. One schema for both: `type` decides whether reference links are
 * optional URLs (quick) or required YouTube links (yt). The form state is the canonical
 * `Blog.js` shape; the only form-only key is `templateIds`, which `toQuickBlogPayload`
 * leaves behind.
 */

export const quickBlogFormSchema = z
  .object({
    type: z.enum(["quick", "yt"]),
    topic: z.string().trim().min(1, "Please enter a topic."),
    template: z.string().nullable(),

    ...keywordsFragment,
    ...referenceLinksFragment,

    imageSource: imageSourceSchema,
    numberOfImages: z.number().min(0),
    languageToWrite: languageSchema,
    ...aiFragment,
    ...optionsFragment,

    // ---- form-only: validated here, never sent ----
    /** Ids of the selected template card, used to re-highlight the grid. */
    templateIds: z.array(z.number()),
  })
  .superRefine((values, ctx) => {
    if (!values.template?.trim()) {
      ctx.addIssue({ path: ["template"], code: "custom", message: "Please select a template." })
    }

    refineKeywords(values, ctx)

    // A YouTube blog is generated *from* the video, so it cannot start without one.
    if (values.type === "yt" && values.referenceLinks.length === 0) {
      ctx.addIssue({
        path: ["referenceLinks"],
        code: "custom",
        message: "Please add at least one valid link.",
      })
    }
    values.referenceLinks.forEach((link, index) => {
      const problem = validateLink(link, values.type === "yt" ? "youtube" : "reference")
      if (problem) ctx.addIssue({ path: ["referenceLinks", index], code: "custom", message: problem })
    })
  })

export type QuickBlogFormValues = z.input<typeof quickBlogFormSchema>

/** Quick blogs are always ~1500 words; the form has no length control. */
export const QUICK_BLOG_WORD_COUNT = 1500

export function quickBlogFormDefaults(type: "quick" | "yt"): QuickBlogFormValues {
  return {
    type,
    topic: "",
    template: null,
    ...keywordsDefaults,
    ...referenceLinksDefaults,
    imageSource: imageDefaults.imageSource as QuickBlogFormValues["imageSource"],
    numberOfImages: 0,
    languageToWrite: Language.ENGLISH,
    aiModel: AI_MODELS[0].id,
    costCutter: true,
    options: generationOptionDefaults({
      // A YouTube blog always embeds the source video.
      embedYouTubeVideos: type === "yt",
    }) satisfies GenerationOptions,
    templateIds: [],
  }
}

/** Form state → request body for `/blogs/quick` and `/blogs/yt`. */
export function toQuickBlogPayload(values: QuickBlogFormValues) {
  const imagesOn = values.imageSource !== IMAGE_SOURCE.NONE
  const researching = values.options.performKeywordResearch
  return buildPayload("QuickBlog", quickBlogFinalDataSchema, {
    type: values.type,
    topic: values.topic.trim(),
    template: values.template,
    // Keyword research writes both lists itself.
    keywords: researching ? [] : values.keywords,
    focusKeywords: researching ? [] : values.focusKeywords,
    referenceLinks: values.referenceLinks,
    imageSource: values.imageSource,
    // Turning images off wins over whatever count was picked earlier.
    numberOfImages: imagesOn ? values.numberOfImages : 0,
    languageToWrite: values.languageToWrite,
    aiModel: values.aiModel,
    costCutter: values.costCutter,
    options: values.options,
  })
}
