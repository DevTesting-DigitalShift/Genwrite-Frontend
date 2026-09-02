import { z } from "zod"
import { buildPayload } from "@/lib/forms"
import { imageSourceSchema, jobFinalDataSchema, languageSchema } from "@/types/forms.schemas"
import { Language, ScheduleType } from "@/types/forms.types"
import { IMAGE_SOURCE, TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"

/**
 * Scheduled-job modal — form contract.
 *
 * The modal used to keep the job in one state object and a handful of the same
 * fields in a second one, then merge them at submit; everything now lives in a
 * single form whose shape *is* the job, with the raw text boxes and the selected
 * template ids alongside it as UI-only fields that `toJobPayload` leaves behind.
 */

export const JOB_MAX_TEMPLATES = 7
export const JOB_MAX_BLOGS = 10
export const JOB_MAX_REFERENCES = 3

export const jobScheduleFormSchema = z.object({
  type: z.enum([
    ScheduleType.DAILY,
    ScheduleType.WEEKLY,
    ScheduleType.WEEKDAYS,
    ScheduleType.MONTHDAYS,
    ScheduleType.CUSTOM,
  ]),
  customDates: z.array(z.string()),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  daysOfMonth: z.array(z.number().min(1).max(31)),
})

export const jobBlogsFormSchema = z.object({
  templates: z.array(z.string()),
  topics: z.array(z.string()),
  keywords: z.array(z.string()),
  references: z.array(z.string()).max(JOB_MAX_REFERENCES, "Maximum 3 references allowed"),

  numberOfBlogs: z.number(),
  numberOfImages: z.number(),
  userDefinedLength: z.number().min(BLOG_CONFIG.LENGTH.MIN).max(BLOG_CONFIG.LENGTH.MAX),

  tone: z.string().min(1, "Please select a tone."),
  languageToWrite: languageSchema,
  aiModel: z.string().min(1, "Please select an AI model."),
  costCutter: z.boolean(),

  isCheckedGeneratedImages: z.boolean(),
  imageSource: imageSourceSchema,
  blogImages: z.array(z.any()),

  useBrandVoice: z.boolean(),
  brandId: z.string().nullable(),
  createBrandedImages: z.boolean(),
  addCTA: z.boolean(),

  postingType: z.string().nullable(),

  /** Opens the fourth step. Persisted with the job so editing reopens it. */
  enableAdvanced: z.boolean(),
})

export const jobOptionsFormSchema = z.object({
  wordpressPosting: z.boolean(),
  includeFaqs: z.boolean(),
  includeCompetitorResearch: z.boolean(),
  includeInterlinks: z.boolean(),
  performKeywordResearch: z.boolean(),
  includeTableOfContents: z.boolean(),
  addOutBoundLinks: z.boolean(),
  easyToUnderstand: z.boolean(),
  embedYouTubeVideos: z.boolean(),
  extendedThinking: z.boolean(),
  deepResearch: z.boolean(),
  humanisation: z.boolean(),
})

export const jobFormSchema = z
  .object({
    name: z.string().min(1, "Please enter a job name."),
    status: z.enum(["active", "stop"]),
    schedule: jobScheduleFormSchema,
    blogs: jobBlogsFormSchema,
    options: jobOptionsFormSchema,

    // ---- UI-only state: validated here, never sent ----
    templateIds: z.array(z.number()),
    topicInput: z.string(),
    keywordInput: z.string(),
    referenceInput: z.string(),
  })
  .superRefine((values, ctx) => {
    const { blogs, options, schedule } = values

    if (blogs.templates.length === 0) {
      ctx.addIssue({
        path: ["blogs", "templates"],
        code: "custom",
        message: "Please select at least one template.",
      })
    } else if (blogs.templates.length > JOB_MAX_TEMPLATES) {
      ctx.addIssue({
        path: ["blogs", "templates"],
        code: "custom",
        message: `You can select a maximum of ${JOB_MAX_TEMPLATES} templates.`,
      })
    }

    if (blogs.topics.length === 0) {
      ctx.addIssue({
        path: ["blogs", "topics"],
        code: "custom",
        message: "Please add at least one topic.",
      })
    }

    if (!options.performKeywordResearch && blogs.keywords.length === 0) {
      ctx.addIssue({
        path: ["blogs", "keywords"],
        code: "custom",
        message: "Please add at least one keyword or enable keyword research.",
      })
    }

    if (blogs.numberOfBlogs < 1 || blogs.numberOfBlogs > JOB_MAX_BLOGS) {
      ctx.addIssue({
        path: ["blogs", "numberOfBlogs"],
        code: "custom",
        message: `Number of blogs must be between 1 and ${JOB_MAX_BLOGS}.`,
      })
    }

    if (blogs.numberOfImages < 0 || blogs.numberOfImages > BLOG_CONFIG.IMAGES.MAX_COUNT) {
      ctx.addIssue({
        path: ["blogs", "numberOfImages"],
        code: "custom",
        message: `Number of images must be between 0 and ${BLOG_CONFIG.IMAGES.MAX_COUNT}.`,
      })
    }

    if (blogs.isCheckedGeneratedImages && !blogs.imageSource) {
      ctx.addIssue({
        path: ["blogs", "imageSource"],
        code: "custom",
        message: "Please select an image source.",
      })
    }

    // A schedule with no days selected would never fire.
    if (schedule.type === ScheduleType.WEEKLY && schedule.daysOfWeek.length === 0) {
      ctx.addIssue({
        path: ["schedule", "daysOfWeek"],
        code: "custom",
        message: "Please select at least one day of the week.",
      })
    }
    if (schedule.type === ScheduleType.MONTHDAYS && schedule.daysOfMonth.length === 0) {
      ctx.addIssue({
        path: ["schedule", "daysOfMonth"],
        code: "custom",
        message: "Please select at least one day of the month.",
      })
    }
    if (schedule.type === ScheduleType.CUSTOM && schedule.customDates.length === 0) {
      ctx.addIssue({
        path: ["schedule", "customDates"],
        code: "custom",
        message: "Please select at least one custom date.",
      })
    }

    if (blogs.enableAdvanced && options.wordpressPosting && !blogs.postingType) {
      ctx.addIssue({
        path: ["blogs", "postingType"],
        code: "custom",
        message: "Please select a posting platform.",
      })
    }
  })

export type JobFormValues = z.input<typeof jobFormSchema>

/** Fields owned by each wizard step, so "Next" only validates what is on screen. */
export const JOB_STEP_FIELDS = {
  1: ["blogs.templates"],
  2: ["name", "blogs.topics", "blogs.keywords"],
  3: [
    "blogs.numberOfBlogs",
    "blogs.numberOfImages",
    "blogs.imageSource",
    "schedule.daysOfWeek",
    "schedule.daysOfMonth",
    "schedule.customDates",
  ],
  4: ["blogs.postingType"],
} as const satisfies Record<number, readonly string[]>

/** The step a failing field belongs to, so a failed submit lands on the right screen. */
export function jobStepOfField(path: string): number {
  const entry = Object.entries(JOB_STEP_FIELDS).find(([, fields]) =>
    (fields as readonly string[]).includes(path)
  )
  return entry ? Number(entry[0]) : 2
}

export const jobFormDefaults: JobFormValues = {
  name: "",
  status: "active",
  schedule: { type: ScheduleType.DAILY, customDates: [], daysOfWeek: [], daysOfMonth: [] },
  blogs: {
    templates: [],
    topics: [],
    keywords: [],
    references: [],
    numberOfBlogs: 1,
    numberOfImages: 0,
    userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT,
    tone: TONES[0],
    languageToWrite: Language.ENGLISH,
    aiModel: "gemini",
    costCutter: true,
    isCheckedGeneratedImages: true,
    imageSource: IMAGE_SOURCE.STOCK as JobFormValues["blogs"]["imageSource"],
    blogImages: [],
    useBrandVoice: false,
    brandId: null,
    createBrandedImages: false,
    addCTA: true,
    postingType: null,
    enableAdvanced: false,
  },
  options: {
    wordpressPosting: false,
    includeFaqs: false,
    includeCompetitorResearch: false,
    includeInterlinks: false,
    performKeywordResearch: false,
    includeTableOfContents: false,
    addOutBoundLinks: false,
    easyToUnderstand: false,
    embedYouTubeVideos: false,
    extendedThinking: false,
    deepResearch: false,
    humanisation: false,
  },
  templateIds: [],
  topicInput: "",
  keywordInput: "",
  referenceInput: "",
}

const SCHEDULE_TYPES = new Set<string>(Object.values(ScheduleType))

/**
 * Merges a job loaded from the API onto the defaults, so missing fields are filled.
 *
 * Two fields need repairing on the way in: a brand reference comes back populated
 * as an object on some responses, and jobs saved by an older build can carry a
 * schedule type the enum never had.
 */
export function jobToFormValues(job: Record<string, any> | null | undefined): JobFormValues {
  if (!job) return jobFormDefaults

  const blogs = { ...jobFormDefaults.blogs, ...(job.blogs ?? {}) }
  const schedule = { ...jobFormDefaults.schedule, ...(job.schedule ?? {}) }

  return {
    ...jobFormDefaults,
    ...job,
    schedule: {
      ...schedule,
      type: SCHEDULE_TYPES.has(schedule.type) ? schedule.type : ScheduleType.DAILY,
    },
    blogs: {
      ...blogs,
      brandId: typeof blogs.brandId === "object" ? (blogs.brandId?._id ?? null) : blogs.brandId,
    },
    options: { ...jobFormDefaults.options, ...(job.options ?? {}) },
    templateIds: job.templateIds ?? [],
    topicInput: "",
    keywordInput: "",
    referenceInput: "",
  }
}

/**
 * Form state to request body for POST/PUT /jobs.
 *
 * `options.brandId` mirrors `blogs.brandId` because the backend reads the brand
 * from both places; both are null unless the job actually uses a brand voice.
 */
export function toJobPayload(values: JobFormValues) {
  const { blogs, options } = values
  const brandId = blogs.useBrandVoice ? blogs.brandId || null : null

  return buildPayload("Job", jobFinalDataSchema, {
    name: values.name,
    status: values.status,
    schedule: {
      type: values.schedule.type,
      customDates: values.schedule.customDates,
      daysOfWeek: values.schedule.daysOfWeek,
      daysOfMonth: values.schedule.daysOfMonth,
    },
    blogs: {
      templates: blogs.templates,
      topics: blogs.topics,
      keywords: blogs.keywords,
      references: blogs.references,
      numberOfBlogs: blogs.numberOfBlogs,
      numberOfImages: blogs.numberOfImages,
      userDefinedLength: blogs.userDefinedLength,
      tone: blogs.tone,
      languageToWrite: blogs.languageToWrite,
      aiModel: blogs.aiModel,
      costCutter: blogs.costCutter,
      isCheckedGeneratedImages: blogs.isCheckedGeneratedImages,
      // Turning images off wins over whatever source was picked earlier.
      imageSource: blogs.isCheckedGeneratedImages ? blogs.imageSource : IMAGE_SOURCE.NONE,
      blogImages: blogs.blogImages,
      useBrandVoice: blogs.useBrandVoice,
      brandId,
      createBrandedImages: blogs.createBrandedImages,
      addCTA: blogs.addCTA,
      postingType: blogs.postingType,
      // Persisted so reopening the job lands back on the advanced step.
      enableAdvanced: blogs.enableAdvanced,
    },
    options: { ...options, brandId },
  })
}
