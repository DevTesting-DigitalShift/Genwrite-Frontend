import { z } from "zod"
import { BLOG_CONFIG } from "@/data/blogConfig"
import { TONES } from "@/data/blogData"
import { keywordsDefaults, keywordsFragment } from "../shared/fragments"

/**
 * Simple blog form (`POST /blogs/new`). The blog is written by the user in the editor, so
 * the request only carries the brief — template, topic, title, keywords, tone and length —
 * and no AI model, images or advanced settings.
 */

export const simpleBlogFormSchema = z
  .object({
    template: z.string().nullable(),
    topic: z.string().trim().min(1, "Topic cannot be empty."),
    title: z.string().trim().min(1, "Please enter a title."),
    tone: z.string().min(1, "Please select a tone."),
    userDefinedLength: z.number().min(BLOG_CONFIG.LENGTH.MIN).max(BLOG_CONFIG.LENGTH.MAX),

    ...keywordsFragment,

    // ---- form-only: validated here, never sent ----
    /** Ids of the selected template card, used to re-highlight the grid. */
    templateIds: z.array(z.number()),
  })
  .superRefine((values, ctx) => {
    if (!values.template?.trim()) {
      ctx.addIssue({ path: ["template"], code: "custom", message: "Please select a template." })
    }
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
        message: "Please add at least one keyword.",
      })
    }
  })

export type SimpleBlogFormValues = z.input<typeof simpleBlogFormSchema>

export const simpleBlogFormDefaults: SimpleBlogFormValues = {
  template: null,
  topic: "",
  title: "",
  tone: TONES[0],
  userDefinedLength: 1200,
  ...keywordsDefaults,
  templateIds: [],
}

/** Form state → request body for `POST /blogs/new`. */
export function toSimpleBlogPayload(values: SimpleBlogFormValues) {
  return {
    title: values.title.trim(),
    topic: values.topic.trim(),
    tone: values.tone.trim(),
    focusKeywords: values.focusKeywords,
    keywords: values.keywords,
    userDefinedLength: Number(values.userDefinedLength),
    template: values.template as string,
    aiModel: "gemini",
    isCheckedGeneratedImages: false,
    isUnsplashActive: false,
  }
}
