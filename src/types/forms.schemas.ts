import { z } from "zod"
import { ImageSource, AiModel, Tone, Language, ScheduleType } from "./forms.types"
import { GENERATION_OPTION_KEYS, type GenerationOptionKey } from "@/forms/shared/options"

export const imageSourceSchema = z
  .enum([ImageSource.NONE, ImageSource.STOCK, ImageSource.AI])
  .describe(
    "Source of images for the blog: none (no images), stock (Pexels/Unsplash), or ai (AI-generated)"
  )

/**
 * The advanced blog modal also lets the user upload their own images, which the
 * other modals do not offer — so only its payload accepts `upload`. Keeping this
 * separate is what stops a stray "upload" from silently failing validation.
 */
export const imageSourceWithUploadSchema = z
  .enum([ImageSource.NONE, ImageSource.STOCK, ImageSource.AI, "upload"])
  .describe("Image source, including user-uploaded images")

export const aiModelSchema = z
  .enum([AiModel.GEMINI, AiModel.OPENAI, AiModel.CLAUDE])
  .describe(
    "AI model to use for content generation: gemini (Google), openai (ChatGPT), or claude (Anthropic)"
  )

export const toneSchema = z
  .enum([
    Tone.CASUAL,
    Tone.CONVERSATIONAL,
    Tone.EMPATHETIC,
    Tone.FORMAL,
    Tone.FRIENDLY,
    Tone.INFORMATIVE,
    Tone.INSPIRATIONAL,
    Tone.PERSUASIVE,
    Tone.PROFESSIONAL,
    Tone.WITTY,
  ])
  .describe("Tone of voice for the blog content")

export const languageSchema = z
  .enum([
    Language.ENGLISH,
    Language.SPANISH,
    Language.GERMAN,
    Language.FRENCH,
    Language.ITALIAN,
    Language.PORTUGUESE,
    Language.DUTCH,
    Language.JAPANESE,
    Language.HINDI,
    Language.CHINESE,
  ])
  .describe("Language in which the blog should be written")

export const scheduleTypeSchema = z
  .enum([
    ScheduleType.DAILY,
    ScheduleType.WEEKLY,
    ScheduleType.WEEKDAYS,
    ScheduleType.MONTHLY,
    ScheduleType.CUSTOM,
  ])
  .describe("Type of job schedule: daily, weekly, weekdays, monthly, or custom dates")

export const postingTypeSchema = z
  .enum(["WORDPRESS", "SHOPIFY", "SERVERENDPOINT", "WIX"])
  .nullable()
  .describe("Publishing platform for automatic posting")

// ============================================================================
// BRAND VOICE PAYLOAD SCHEMA
// ============================================================================

/** Wire contract for `POST /brand/addBrand` and `PUT /brand/:id`. */
export const brandVoicePayloadSchema = z.object({
  nameOfVoice: z.string().min(1).describe("Display name of the brand voice"),
  postLink: z.string().min(1).describe("A representative page on the brand's site"),
  describeBrand: z.string().min(1).describe("What the brand is and how it sounds"),
  sitemap: z.string().min(1).describe("Sitemap URL used to crawl the brand's content"),
  persona: z.string().min(1).describe("Who the brand is writing for"),
  keywords: z.array(z.string()).describe("Keywords that characterise the brand"),
  logoUrl: z.string().describe("Uploaded logo, without its cache-busting query"),
})

export type BrandVoicePayload = z.infer<typeof brandVoicePayloadSchema>

// ============================================================================
// SHARED WIRE FRAGMENTS
// ============================================================================
//
// Every generation endpoint speaks the same key names, taken from `models/Blog.js` on the
// backend: scalars at the top level, feature toggles under `options`, links in
// `referenceLinks`, the brand switch as `isCheckedBrand`, the posting target as
// `postingDefaultType`. The fragments below are spread into each request schema.

/** `options` as sent on the wire; every toggle defaults off. */
export const generationOptionsPayloadSchema = z.object(
  Object.fromEntries(
    GENERATION_OPTION_KEYS.map((key) => [key, z.boolean().default(false)])
  ) as Record<GenerationOptionKey, z.ZodDefault<z.ZodBoolean>>
)

const referenceLinksPayload = z
  .array(z.string().url())
  .max(3)
  .default([])
  .describe("Reference links or YouTube video URLs (max 3)")

const brandPayload = {
  isCheckedBrand: z.boolean().default(false).describe("Whether to write in a brand voice"),
  brandId: z.string().nullable().optional().describe("Brand voice ID when isCheckedBrand is true"),
}

const aiPayload = {
  aiModel: aiModelSchema.default(AiModel.GEMINI).describe("AI model for content generation"),
  costCutter: z.boolean().default(true).describe("Use AI Flash model for 50% credit savings"),
}

const writingPayload = {
  tone: toneSchema.describe("Tone of voice for the blog content"),
  userDefinedLength: z
    .number()
    .min(500)
    .max(5000)
    .default(1000)
    .describe("Target word count (500-5000)"),
  languageToWrite: languageSchema
    .default(Language.ENGLISH)
    .describe("Target language for the blog content"),
}

// ============================================================================
// QUICK BLOG FINAL DATA SCHEMA
// ============================================================================

export const quickBlogFinalDataSchema = z.object({
  type: z.enum(["quick", "yt"]).describe("Blog type: quick (standard) or yt (YouTube-based)"),
  topic: z.string().min(1, "Topic is required").describe("The main topic of the blog post"),
  // Required for quick; a YouTube blog's template is picked from its videos.
  template: z.string().optional().describe("Selected blog template name"),

  keywords: z.array(z.string()).default([]).describe("Secondary keywords for SEO"),
  focusKeywords: z.array(z.string()).max(3).default([]).describe("Primary focus keywords (max 3)"),
  referenceLinks: referenceLinksPayload,

  // Everything else (model, cost cutter, images, length, language…) is the backend's
  // per-type default — see BLOG_TYPE_DEFAULTS in the backend's createBlog.schema.js.
  options: z.object({
    exactTitle: z.boolean().describe("Use the exact topic as the blog title"),
    performKeywordResearch: z.boolean(),
  }),
})

export type QuickBlogFinalDataSchemaType = z.infer<typeof quickBlogFinalDataSchema>

// ============================================================================
// BULK BLOG FINAL DATA SCHEMA
// ============================================================================

export const bulkBlogFinalDataSchema = z.object({
  templates: z.array(z.string()).min(1, "At least one template is required"),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  keywords: z.array(z.string()).default([]),

  ...writingPayload,
  ...aiPayload,
  ...brandPayload,

  numberOfBlogs: z.number().min(1).max(10).default(1).describe("Number of blogs (1-10)"),
  postFrequency: z.number().default(600).describe("Post frequency in seconds"),

  imageSource: imageSourceSchema.default(ImageSource.NONE).describe("Where images come from"),
  numberOfImages: z.number().min(0).max(15).default(0),

  postingDefaultType: postingTypeSchema.optional(),

  options: generationOptionsPayloadSchema,
})

export type BulkBlogFinalDataSchemaType = z.infer<typeof bulkBlogFinalDataSchema>

// ============================================================================
// JOB FINAL DATA SCHEMA
// ============================================================================

export const jobScheduleSchema = z.object({
  type: scheduleTypeSchema.default(ScheduleType.DAILY).describe("Schedule frequency type"),
  customDates: z.array(z.string()).default([]).describe("Custom dates for 'custom' schedule type"),
  daysOfWeek: z
    .array(z.number().min(0).max(6))
    .default([])
    .describe("Days of week (0-6, Sun-Sat) for 'weekly' schedule"),
  daysOfMonth: z
    .array(z.number().min(1).max(31))
    .default([])
    .describe("Days of month (1-31) for 'monthly' schedule"),
})

export const jobBlogConfigSchema = z.object({
  numberOfBlogs: z.number().min(1).max(10).default(1).describe("Number of blogs per schedule run"),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  keywords: z.array(z.string()).default([]),
  templates: z.array(z.string()).min(1, "At least one template is required"),
  referenceLinks: referenceLinksPayload,

  ...writingPayload,
  ...aiPayload,
  ...brandPayload,

  imageSource: imageSourceSchema.default(ImageSource.NONE),
  numberOfImages: z.number().min(0).max(15).default(0),

  postingDefaultType: postingTypeSchema.optional(),
})

export const jobFinalDataSchema = z.object({
  name: z.string().min(1, "Job name is required").describe("Name of the job"),
  schedule: jobScheduleSchema.describe("Job schedule configuration"),
  blogs: jobBlogConfigSchema.describe("Blog generation configuration"),
  options: generationOptionsPayloadSchema.describe("Per-blog feature toggles"),
  status: z.enum(["active", "stop"]).default("stop").describe("Current job status"),
})

export type JobFinalDataSchemaType = z.infer<typeof jobFinalDataSchema>

// ============================================================================
// ADVANCED BLOG FINAL DATA SCHEMA
// ============================================================================

export const advancedBlogFinalDataSchema = z.object({
  template: z.string().min(1, "Template is required").describe("Selected template name"),
  topic: z.string().min(1, "Topic is required").describe("Blog topic/subject"),
  title: z.string().optional().describe("Blog title (optional if performKeywordResearch)"),
  brief: z.string().default("").describe("Brief section or special instructions"),

  focusKeywords: z.array(z.string()).max(3).optional(),
  keywords: z.array(z.string()).optional(),
  referenceLinks: referenceLinksPayload,

  ...writingPayload,
  ...aiPayload,
  isCheckedBrand: brandPayload.isCheckedBrand,
  brandId: z.string().optional().describe("Brand voice ID (required if isCheckedBrand)"),

  imageSource: imageSourceWithUploadSchema.default(ImageSource.NONE).describe("Image source type"),
  numberOfImages: z
    .number()
    .min(0)
    .max(15)
    .default(0)
    .describe("Number of images (0 = AI decides)"),
  blogImages: z.array(z.any()).optional().describe("Custom uploaded images"),

  isCheckedQuick: z.boolean().default(false).describe("Add quick summary section"),

  postingDefaultType: postingTypeSchema.optional(),

  options: generationOptionsPayloadSchema,
})

export type AdvancedBlogFinalDataSchemaType = z.infer<typeof advancedBlogFinalDataSchema>

// ============================================================================
// REGENERATE BLOG SCHEMA
// ============================================================================

export const regenerateBlogOptionsSchema = z.object({
  includeFaqs: z.boolean().default(false).describe("Include FAQ section"),
  includeInterlinks: z.boolean().default(false).describe("Include internal links"),
  includeCompetitorResearch: z.boolean().default(false).describe("Perform competitor research"),
  addOutBoundLinks: z.boolean().default(false).describe("Include outbound links"),
  addCTA: z.boolean().default(false).describe("Add call-to-action"),
  automaticPosting: z.boolean().default(false).describe("Enable automatic posting"),
  includeTableOfContents: z.boolean().default(false).describe("Include table of contents"),
  easyToUnderstand: z
    .boolean()
    .default(false)
    .describe("Use v2 system prompts for 8th grader level readability"),
  embedYouTubeVideos: z
    .boolean()
    .default(false)
    .describe("Embed YouTube videos in the blog content"),
  extendedThinking: z.boolean().default(false).describe("Deepen AI reasoning for logical outputs"),
  deepResearch: z
    .boolean()
    .default(false)
    .describe("Extensive multi-source investigative research"),
  humanisation: z
    .boolean()
    .default(false)
    .describe("Natural linguistic patterns to bypass AI filters"),
  performKeywordResearch: z
    .boolean()
    .default(false)
    .describe("Auto-generate title and keywords based on topic"),
  createBrandedImages: z
    .boolean()
    .default(false)
    .describe("Create AI images with brand voice characteristics"),
})

/**
 * Wire contract for `POST /blogs/:id/retry`.
 *
 * Cross-field rules (what is required once `createNew` is on, when a brand id is
 * needed) live on the *form* schema in `forms/regenerateBlogForm.ts`; this one
 * only describes the body, so building a payload cannot silently rewrite it.
 */
export const regenerateBlogSchema = z.object({
  createNew: z.boolean().describe("Whether to create new content from scratch"),
  topic: z.string().optional(),
  title: z.string().optional(),
  focusKeywords: z.array(z.string()).max(3).optional(),
  keywords: z.array(z.string()).optional(),
  tone: z.string().optional(),
  userDefinedLength: z.number().min(500).max(5000).optional(),
  aiModel: aiModelSchema.optional(),
  isCheckedGeneratedImages: z.boolean().optional(),
  imageSource: imageSourceSchema.optional(),
  numberOfImages: z.number().min(0).max(15).default(0),
  isCheckedBrand: z.boolean().optional(),
  brandId: z.string().optional(),
  costCutter: z.boolean().default(true).describe("Use AI Flash model for 25% credit savings"),
  isCheckedQuick: z.boolean().default(false).describe("Add quick summary section"),
  postingDefaultType: postingTypeSchema
    .optional()
    .describe("Publishing platform for automatic posting"),
  options: regenerateBlogOptionsSchema,
})

export type RegenerateBlogSchemaType = z.infer<typeof regenerateBlogSchema>
