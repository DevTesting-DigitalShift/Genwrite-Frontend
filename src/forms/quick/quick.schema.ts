import { z } from "zod"
import { buildPayload } from "@/lib/forms"
import { quickBlogFinalDataSchema } from "@/types/forms.schemas"
import { IMAGE_SOURCE } from "@/data/blogData"
import {
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
 * Quick / YouTube blog form. Both are the "just give me a blog" options, so the user sets very
 * little and `POST /blogs` (with `type`) fills the rest from the backend's per-type defaults
 * (`BLOG_TYPE_DEFAULTS` in createBlog.schema.js):
 *
 * - quick: template + topic; keyword research is on unless the user turns it off to give
 *   their own keywords; optional reference links.
 * - yt: YouTube links + topic; the backend's yt-setup step reads the videos and picks the
 *   template and keywords.
 *
 * Both offer "Use exact topic as blog title" (on by default). `templateIds` is form-only.
 */

export const quickBlogFormSchema = z
  .object({
    type: z.enum(["quick", "yt"]),
    topic: z.string().trim().min(1, "Please enter a topic."),
    template: z.string().nullable(),

    ...keywordsFragment,
    ...referenceLinksFragment,
    ...optionsFragment,

    // ---- form-only: validated here, never sent ----
    /** Ids of the selected template card, used to re-highlight the grid. */
    templateIds: z.array(z.number()),
  })
  .superRefine((values, ctx) => {
    if (values.type === "quick") {
      if (!values.template?.trim()) {
        ctx.addIssue({ path: ["template"], code: "custom", message: "Please select a template." })
      }
      refineKeywords(values, ctx)
    }

    // A YouTube blog is generated *from* the video, so it cannot start without one.
    if (values.type === "yt" && values.referenceLinks.length === 0) {
      ctx.addIssue({
        path: ["referenceLinks"],
        code: "custom",
        message: "Please add at least one YouTube video link.",
      })
    }
    values.referenceLinks.forEach((link, index) => {
      const problem = validateLink(link, values.type === "yt" ? "youtube" : "reference")
      if (problem)
        ctx.addIssue({ path: ["referenceLinks", index], code: "custom", message: problem })
    })
  })

export type QuickBlogFormValues = z.input<typeof quickBlogFormSchema>

/** Quick / YouTube blogs are ~800 words (the backend's LIGHT_BLOG_WORD_COUNT); no length control. */
export const QUICK_BLOG_WORD_COUNT = 800

/**
 * What the backend writes a quick / YouTube blog with — Gemini behind the cost cutter, stock
 * images, image count left to the AI. Not sent; mirrored only for the credit estimate.
 */
export const QUICK_BLOG_FIXED = {
  aiModel: "gemini",
  costCutter: true,
  imageSource: IMAGE_SOURCE.STOCK,
  numberOfImages: 0,
} as const

export function quickBlogFormDefaults(type: "quick" | "yt"): QuickBlogFormValues {
  return {
    type,
    topic: "",
    template: null,
    ...keywordsDefaults,
    ...referenceLinksDefaults,
    // The backend's defaults for the type, so the estimate and the switches match the blog.
    options: generationOptionDefaults({
      exactTitle: true,
      performKeywordResearch: type === "quick",
      addOutBoundLinks: true,
      embedYouTubeVideos: type === "yt",
    }) satisfies GenerationOptions,
    templateIds: [],
  }
}

/** Form state → request body for `POST /blogs` with `type` "quick" or "yt". */
export function toQuickBlogPayload(values: QuickBlogFormValues) {
  const researching = values.options.performKeywordResearch
  // A YouTube blog's keywords come from its videos; a quick blog's from the user or research.
  const ownKeywords = values.type === "quick" && !researching
  return buildPayload("QuickBlog", quickBlogFinalDataSchema, {
    type: values.type,
    topic: values.topic.trim(),
    template: values.type === "quick" ? (values.template ?? undefined) : undefined,
    keywords: ownKeywords ? values.keywords : [],
    focusKeywords: ownKeywords ? values.focusKeywords : [],
    referenceLinks: values.referenceLinks,
    options: {
      exactTitle: values.options.exactTitle,
      performKeywordResearch: values.type === "quick" && researching,
    },
  })
}
