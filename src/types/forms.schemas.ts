/**
 * Zod Validation Schemas for Modal Forms
 *
 * This file contains Zod schemas for API data validation with:
 * - .optional() for optional fields
 * - .default() for default values
 * - .describe() for documentation
 *
 * Use VITE_VALIDATE_FORMS=true env variable to enable validation on form submit
 */

import { z } from "zod"
import { ImageSource, AiModel, Tone, Language, ScheduleType } from "./forms.types"

// ============================================================================
// SHARED ENUM SCHEMAS
// ============================================================================

export const imageSourceSchema = z
  .enum([ImageSource.NONE, ImageSource.STOCK, ImageSource.AI, ImageSource.UPLOAD])
  .describe(
    "Source of images for the blog: none (no images), stock (Pexels/Unsplash), ai (AI-generated), or upload (custom uploaded images)"
  )

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
    ScheduleType.MONTHDAYS,
    ScheduleType.CUSTOM,
  ])
  .describe("Type of job schedule: daily, weekly, weekdays, monthdays, or custom dates")

export const postingTypeSchema = z
  .enum(["WORDPRESS", "SHOPIFY", "SERVERENDPOINT", "WIX"])
  .nullable()
  .describe("Publishing platform for automatic posting")

// ============================================================================
// QUICK BLOG FINAL DATA SCHEMA
// ============================================================================

export const quickBlogFinalDataSchema = z.object({
  topic: z
    .string()
    .min(1, "Topic is required")
    .describe("The main topic or subject of the blog post"),

  exactTitle: z
    .boolean()
    .default(false)
    .describe("Whether to use the topic as the exact blog title"),

  performKeywordResearch: z
    .boolean()
    .default(false)
    .describe("Whether to perform AI-powered keyword research"),

  addImages: z.boolean().default(false).describe("Whether to add images to the blog"),

  imageSource: imageSourceSchema
    .default(ImageSource.NONE)
    .describe("Source of images when addImages is true"),

  template: z.string().nullable().describe("Selected blog template name"),

  keywords: z.array(z.string()).default([]).describe("Secondary keywords for SEO optimization"),

  focusKeywords: z
    .array(z.string())
    .max(3)
    .default([])
    .describe("Primary focus keywords (max 3) for SEO"),

  languageToWrite: languageSchema
    .default(Language.ENGLISH)
    .describe("Target language for the blog content"),

  costCutter: z.boolean().default(true).describe("Use AI Flash model for 25% credit savings"),

  easyToUnderstand: z
    .boolean()
    .default(false)
    .describe("Use v2 system prompts for 8th grader level readability"),

  embedYouTubeVideos: z
    .boolean()
    .default(false)
    .describe("Embed YouTube videos in the blog content"),

  type: z.enum(["quick", "yt"]).describe("Blog type: quick (standard) or yt (YouTube-based)"),

  otherLinks: z
    .array(z.string().url())
    .max(3)
    .default([])
    .describe("Reference links or YouTube video URLs (max 3)"),
})

export type QuickBlogFinalDataSchemaType = z.infer<typeof quickBlogFinalDataSchema>

// ============================================================================
// BULK BLOG FINAL DATA SCHEMA
// ============================================================================

export const bulkBlogFinalDataSchema = z
  .object({
    templates: z
      .array(z.string())
      .min(1, "At least one template is required")
      .describe("Selected blog template names"),

    topics: z
      .array(z.string())
      .min(1, "At least one topic is required")
      .describe("List of blog topics to generate"),

    keywords: z
      .array(z.string())
      .default([])
      .describe("Keywords for SEO (required if performKeywordResearch is false)"),

    performKeywordResearch: z
      .boolean()
      .default(true)
      .describe("Whether to perform AI-powered keyword research"),

    tone: toneSchema,

    languageToWrite: languageSchema
      .default(Language.ENGLISH)
      .describe("Target language for blog content"),

    userDefinedLength: z
      .number()
      .min(500)
      .max(5000)
      .default(1000)
      .describe("Target word count for each blog (500-5000)"),

    imageSource: imageSourceSchema
      .default(ImageSource.STOCK)
      .describe("Source of images for blogs"),

    useBrandVoice: z.boolean().default(false).describe("Whether to use a custom brand voice"),

    useCompetitors: z.boolean().default(false).describe("Whether to perform competitor research"),

    includeInterlinks: z.boolean().default(true).describe("Whether to include internal links"),

    includeFaqs: z.boolean().default(true).describe("Whether to include FAQ section"),

    numberOfBlogs: z
      .number()
      .min(1)
      .max(10)
      .default(1)
      .describe("Number of blogs to generate (1-10)"),

    numberOfImages: z
      .number()
      .min(0)
      .max(20)
      .default(0)
      .describe("Number of images per blog (0 = AI decides)"),

    wordpressPostStatus: z.boolean().default(false).describe("Whether to enable automatic posting"),

    postFrequency: z.number().default(600).describe("Post frequency in seconds"),

    aiModel: aiModelSchema.default(AiModel.GEMINI).describe("AI model for content generation"),

    includeTableOfContents: z
      .boolean()
      .default(false)
      .describe("Whether to include table of contents"),

    isCheckedGeneratedImages: z
      .boolean()
      .default(true)
      .describe("Whether images should be generated/included"),

    addOutBoundLinks: z.boolean().default(false).describe("Whether to include outbound links"),

    blogImages: z.array(z.any()).optional().describe("Custom uploaded images (File objects)"),

    postingType: postingTypeSchema.optional().describe("Publishing platform for automatic posting"),

    brandId: z.string().nullable().optional().describe("Brand voice ID when useBrandVoice is true"),

    addCTA: z.boolean().default(false).describe("Whether to add call-to-action"),

    costCutter: z.boolean().default(true).describe("Use AI Flash model for 25% credit savings"),

    easyToUnderstand: z
      .boolean()
      .default(false)
      .describe("Use v2 system prompts for 8th grader level readability"),

    embedYouTubeVideos: z
      .boolean()
      .default(false)
      .describe("Embed YouTube videos in the blog content"),
  })
  .transform(data => {
    // Strip irrelevant UI state fields
    const { topicInput, keywordInput, isDragging, templateIds, ...cleanData } = data as any
    return cleanData
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

  topics: z
    .array(z.string())
    .min(1, "At least one topic is required")
    .describe("List of blog topics"),

  keywords: z.array(z.string()).default([]).describe("Keywords for SEO optimization"),

  templates: z
    .array(z.string())
    .min(1, "At least one template is required")
    .describe("Selected template names"),

  tone: toneSchema.default(Tone.PROFESSIONAL).describe("Tone of voice for content"),

  userDefinedLength: z.number().min(500).max(5000).default(1000).describe("Target word count"),

  imageSource: imageSourceSchema.default(ImageSource.STOCK).describe("Image source type"),

  aiModel: aiModelSchema.default(AiModel.GEMINI).describe("AI model for generation"),

  brandId: z.string().nullable().optional().describe("Brand voice ID"),

  useBrandVoice: z.boolean().default(false).describe("Use custom brand voice"),

  isCheckedGeneratedImages: z.boolean().default(true).describe("Enable image generation"),

  isCheckedCustomImages: z.boolean().default(false).describe("Use custom uploaded images"),

  addCTA: z.boolean().default(true).describe("Add call-to-action"),

  numberOfImages: z.number().min(0).max(20).default(0).describe("Number of images"),

  blogImages: z.array(z.any()).optional().describe("Custom image files"),

  postingType: postingTypeSchema.optional().describe("Auto-posting platform"),

  languageToWrite: languageSchema.default(Language.ENGLISH).describe("Content language"),

  costCutter: z.boolean().default(true).describe("Enable cost cutter mode"),

  easyToUnderstand: z
    .boolean()
    .default(false)
    .describe("Use v2 system prompts for 8th grader level readability"),

  embedYouTubeVideos: z
    .boolean()
    .default(false)
    .describe("Embed YouTube videos in the blog content"),
})

export const jobOptionsSchema = z.object({
  wordpressPosting: z.boolean().default(false).describe("Enable automatic WordPress posting"),

  includeFaqs: z.boolean().default(false).describe("Include FAQ section"),

  includeCompetitorResearch: z.boolean().default(false).describe("Perform competitor research"),

  includeInterlinks: z.boolean().default(false).describe("Include internal links"),

  performKeywordResearch: z.boolean().default(false).describe("Auto-generate keywords"),

  includeTableOfContents: z.boolean().default(false).describe("Include table of contents"),

  addOutBoundLinks: z.boolean().default(false).describe("Include outbound links"),

  easyToUnderstand: z
    .boolean()
    .default(false)
    .describe("Use v2 system prompts for 8th grader level readability"),

  embedYouTubeVideos: z
    .boolean()
    .default(false)
    .describe("Embed YouTube videos in the blog content"),

  brandId: z.string().nullable().optional().describe("Brand voice ID for job"),
})

export const jobFinalDataSchema = z
  .object({
    name: z.string().min(1, "Job name is required").describe("Name of the job"),

    schedule: jobScheduleSchema.describe("Job schedule configuration"),

    blogs: jobBlogConfigSchema.describe("Blog generation configuration"),

    options: jobOptionsSchema.describe("Additional job options"),

    status: z.enum(["active", "stop"]).default("stop").describe("Current job status"),

    templateIds: z.array(z.number()).default([]).describe("Selected template IDs"),
  })
  .transform(data => {
    // Strip irrelevant UI state fields
    const { templateIds, ...cleanData } = data as any
    return cleanData
  })

export type JobFinalDataSchemaType = z.infer<typeof jobFinalDataSchema>

// ============================================================================
// ADVANCED BLOG FINAL DATA SCHEMA
// ============================================================================

export const advancedBlogOptionsSchema = z.object({
  exactTitle: z.boolean().default(false).describe("Use exact title as provided"),

  performKeywordResearch: z.boolean().default(false).describe("Auto-generate title and keywords"),

  includeFaqs: z.boolean().default(false).describe("Include FAQ section"),

  includeInterlinks: z.boolean().default(false).describe("Include internal links"),

  includeCompetitorResearch: z.boolean().default(false).describe("Perform competitor research"),

  addOutBoundLinks: z.boolean().default(false).describe("Include outbound links"),

  addCTA: z.boolean().default(false).describe("Add call-to-action"),

  easyToUnderstand: z
    .boolean()
    .default(false)
    .describe("Use v2 system prompts for 8th grader level readability"),

  embedYouTubeVideos: z
    .boolean()
    .default(false)
    .describe("Embed YouTube videos in the blog content"),
})

export const advancedBlogFinalDataSchema = z
  .object({
    templateIds: z
      .array(z.number())
      .length(1, "Exactly one template is required")
      .describe("Selected template ID (single selection)"),

    template: z.string().min(1, "Template is required").describe("Selected template name"),

    topic: z.string().min(1, "Topic is required").describe("Blog topic/subject"),

    focusKeywords: z
      .array(z.string())
      .max(3)
      .optional()
      .describe("Focus keywords (max 3, optional if performKeywordResearch)"),

    keywords: z
      .array(z.string())
      .optional()
      .describe("Secondary keywords (optional if performKeywordResearch)"),

    title: z.string().optional().describe("Blog title (optional if performKeywordResearch)"),

    tone: toneSchema.describe("Tone of voice for content"),

    userDefinedLength: z
      .number()
      .min(500)
      .max(5000)
      .default(1000)
      .describe("Target word count (500-5000)"),

    brief: z.string().default("").describe("Brief section or special instructions"),

    aiModel: aiModelSchema.default(AiModel.GEMINI).describe("AI model for content generation"),

    isCheckedGeneratedImages: z.boolean().default(false).describe("Enable image generation"),

    imageSource: imageSourceSchema.default(ImageSource.STOCK).describe("Image source type"),

    numberOfImages: z
      .number()
      .min(0)
      .max(15)
      .default(0)
      .describe("Number of images (0 = AI decides)"),

    blogImages: z.array(z.any()).optional().describe("Custom uploaded images"),

    referenceLinks: z.array(z.string().url()).max(3).default([]).describe("Reference URLs (max 3)"),

    isCheckedQuick: z.boolean().default(false).describe("Add quick summary section"),

    isCheckedBrand: z.boolean().default(false).describe("Use custom brand voice"),

    brandId: z.string().optional().describe("Brand voice ID (required if isCheckedBrand)"),

    languageToWrite: languageSchema
      .default(Language.ENGLISH)
      .describe("Target language for content"),

    costCutter: z.boolean().default(true).describe("Use AI Flash model for 25% savings"),

    options: advancedBlogOptionsSchema.describe("Advanced blog options"),
  })
  .transform(data => {
    // Strip irrelevant UI state fields - templateIds is only used in frontend
    const { templateIds, ...cleanData } = data as any
    return cleanData
  })

export type AdvancedBlogFinalDataSchemaType = z.infer<typeof advancedBlogFinalDataSchema>

// ============================================================================
// VALIDATION UTILITY
// ============================================================================

/**
 * Validates form data against a Zod schema when VITE_VALIDATE_FORMS=true
 * Logs validation results to console for debugging
 *
 * @param schemaName - Name of the schema for logging
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed data if valid, original data if validation disabled or failed
 */
export function validateFormData<T extends z.ZodSchema>(
  schemaName: string,
  schema: T,
  data: unknown
): z.infer<T> | unknown {
  console.group(`🔍 [Zod Validation] ${schemaName}`)

  const result = schema.safeParse(data)

  if (result.success) {
    console.groupEnd()
    return result.data
  } else {
    console.error("❌ Validation FAILED")
    console.error("🚨 Errors:", result.error.format())
    console.error("📋 Flat Errors:", result.error.flatten())
    console.groupEnd()
    return data
  }
}

/**
 * Type-safe validation wrapper functions for each modal
 */
export const validateQuickBlogData = (data: unknown) =>
  validateFormData("QuickBlogFinalData", quickBlogFinalDataSchema, data)

export const validateBulkBlogData = (data: unknown) =>
  validateFormData("BulkBlogFinalData", bulkBlogFinalDataSchema, data)

export const validateJobData = (data: unknown) =>
  validateFormData("JobFinalData", jobFinalDataSchema, data)

export const validateAdvancedBlogData = (data: unknown) =>
  validateFormData("AdvancedBlogFinalData", advancedBlogFinalDataSchema, data)

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
})

export const regenerateBlogSchema = z.object({
  createNew: z.boolean().describe("Whether to create new content from scratch"),
  topic: z.string().min(1, "Topic cannot be empty").optional(),
  title: z.string().optional(),
  focusKeywords: z.array(z.string()).max(3).optional(),
  keywords: z.array(z.string()).optional(),
  tone: z.string().optional(),
  userDefinedLength: z.number().min(500).max(5000).optional(),
  aiModel: aiModelSchema.optional(),
  isCheckedGeneratedImages: z.boolean().optional(),
  imageSource: imageSourceSchema.optional(),
  numberOfImages: z.number().min(0).max(20).default(0),
  isCheckedBrand: z.boolean().optional(),
  brandId: z.string().optional(),
  addCTA: z.boolean().optional(),
  costCutter: z.boolean().default(true).describe("Use AI Flash model for 25% credit savings"),
  isCheckedQuick: z.boolean().default(false).describe("Add quick summary section"),
  postingDefaultType: postingTypeSchema
    .optional()
    .describe("Publishing platform for automatic posting"),
  options: regenerateBlogOptionsSchema,
})

export type RegenerateBlogSchemaType = z.infer<typeof regenerateBlogSchema>

export const validateRegenerateBlogData = (data: unknown) =>
  validateFormData("RegenerateBlogData", regenerateBlogSchema, data)
