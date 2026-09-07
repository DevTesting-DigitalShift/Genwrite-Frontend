import { z } from "zod"
import { buildPayload } from "@/lib/forms"
import { imageSourceSchema, languageSchema, quickBlogFinalDataSchema } from "@/types/forms.schemas"
import { ImageSource, Language } from "@/types/forms.types"
import { AI_MODELS, IMAGE_SOURCE } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"

/**
 * Quick / YouTube blog modal — form contract.
 *
 * `quickBlogFormSchema` is what react-hook-form validates and therefore holds
 * everything the UI needs, including the raw tag inputs and the "advanced
 * options" switch. `toQuickBlogPayload` maps that state onto
 * `quickBlogFinalDataSchema` (the wire contract in `types/forms.schemas.ts`),
 * which drops every UI-only key. Add a field to the request by adding one line
 * to both; stop sending one by removing it from the payload schema.
 */

export const QUICK_BLOG_MAX_LINKS = 3
export const QUICK_BLOG_MAX_FOCUS_KEYWORDS = 3

export const quickBlogFormSchema = z
  .object({
    /** "quick" or "yt" — fixed by the caller, not editable in the UI. */
    type: z.enum(["quick", "yt"]),

    topic: z.string().min(1, "Please enter a topic."),
    exactTitle: z.boolean(),
    performKeywordResearch: z.boolean(),

    addImages: z.boolean(),
    imageSource: imageSourceSchema,
    numberOfImages: z.number().min(0).max(BLOG_CONFIG.IMAGES.MAX_COUNT),

    template: z.string().nullable(),
    keywords: z.array(z.string()),
    focusKeywords: z
      .array(z.string())
      .max(QUICK_BLOG_MAX_FOCUS_KEYWORDS, "You can only add up to 3 focus keywords."),
    otherLinks: z.array(z.string()).max(QUICK_BLOG_MAX_LINKS, "You can only add up to 3 links."),

    languageToWrite: languageSchema,
    aiModel: z.string(),
    costCutter: z.boolean(),

    easyToUnderstand: z.boolean(),
    embedYouTubeVideos: z.boolean(),
    humanisation: z.boolean(),
    extendedThinking: z.boolean(),
    deepResearch: z.boolean(),
    createBrandedImages: z.boolean(),

    // ---- UI-only state: validated here, never sent ----
    /** Ids of the selected template cards, used to re-highlight the grid. */
    templateIds: z.array(z.number()),
    /** Opens the extra AI-model / advanced-options step. */
    enableAdvanced: z.boolean(),
    otherLinkInput: z.string(),
    focusKeywordInput: z.string(),
    keywordInput: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.template?.trim()) {
      ctx.addIssue({ path: ["template"], code: "custom", message: "Please select a template." })
    }

    // Keyword research replaces the manual keyword lists, so they are only
    // required while it is off.
    if (!values.performKeywordResearch) {
      if (values.focusKeywords.length === 0) {
        ctx.addIssue({
          path: ["focusKeywords"],
          code: "custom",
          message: "Please add at least one focus keyword.",
        })
      }
      if (values.keywords.length === 0) {
        ctx.addIssue({
          path: ["keywords"],
          code: "custom",
          message: "Please add at least one secondary keyword.",
        })
      }
    }

    // A YouTube blog is generated *from* the video, so it cannot start without one.
    if (values.type === "yt" && values.otherLinks.length === 0) {
      ctx.addIssue({
        path: ["otherLinks"],
        code: "custom",
        message: "Please add at least one valid link.",
      })
    }
  })

export type QuickBlogFormValues = z.input<typeof quickBlogFormSchema>

/** Fields owned by each wizard step, so "Next" only validates what is on screen. */
export const QUICK_BLOG_STEP_FIELDS = {
  0: ["template"],
  1: ["topic", "focusKeywords", "keywords", "otherLinks"],
  2: [],
} as const satisfies Record<number, readonly (keyof QuickBlogFormValues)[]>

export function quickBlogFormDefaults(type: "quick" | "yt"): QuickBlogFormValues {
  return {
    type,
    topic: "",
    exactTitle: false,
    performKeywordResearch: false,
    addImages: false,
    imageSource: ImageSource.NONE,
    numberOfImages: 0,
    template: null,
    keywords: [],
    focusKeywords: [],
    otherLinks: [],
    languageToWrite: Language.ENGLISH,
    aiModel: AI_MODELS[0].id,
    costCutter: true,
    easyToUnderstand: false,
    // A YouTube blog always embeds the source video.
    embedYouTubeVideos: type === "yt",
    humanisation: false,
    extendedThinking: false,
    deepResearch: false,
    createBrandedImages: false,
    templateIds: [],
    enableAdvanced: false,
    otherLinkInput: "",
    focusKeywordInput: "",
    keywordInput: "",
  }
}

/**
 * Form state → request body.
 *
 * Not sent, deliberately: `aiModel`. The advanced step collects it and the credit
 * estimate uses it, but `/blogs/quick` and `/blogs/yt` do not accept it today —
 * add it to `quickBlogFinalDataSchema` and to the object below on the day they do.
 */
export function toQuickBlogPayload(values: QuickBlogFormValues) {
  return buildPayload("QuickBlog", quickBlogFinalDataSchema, {
    type: values.type,
    topic: values.topic.trim(),
    template: values.template,
    exactTitle: values.exactTitle,
    performKeywordResearch: values.performKeywordResearch,
    keywords: values.keywords,
    focusKeywords: values.focusKeywords,
    otherLinks: values.otherLinks,
    addImages: values.addImages,
    // Turning images off wins over whatever source and count were picked earlier.
    imageSource: values.addImages ? values.imageSource : IMAGE_SOURCE.NONE,
    numberOfImages: values.addImages ? values.numberOfImages : 0,
    languageToWrite: values.languageToWrite,
    costCutter: values.costCutter,
    easyToUnderstand: values.easyToUnderstand,
    embedYouTubeVideos: values.embedYouTubeVideos,
    humanisation: values.humanisation,
    extendedThinking: values.extendedThinking,
    deepResearch: values.deepResearch,
    createBrandedImages: values.createBrandedImages,
  })
}
