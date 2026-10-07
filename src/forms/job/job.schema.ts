import { z } from "zod"
import { buildPayload, includeIf } from "@/lib/forms"
import { imageSourceSchema, jobFinalDataSchema } from "@/types/forms.schemas"
import { ScheduleType } from "@/types/forms.types"
import { IMAGE_SOURCE, TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import { packages } from "@/data/templates"
import {
  aiFragment,
  brandDefaults,
  brandFragment,
  keywordsFragment,
  optionsFragment,
  postingDefaults,
  postingFragment,
  referenceLinksDefaults,
  referenceLinksFragment,
  refineBrand,
  refineKeywords,
  refinePosting,
  writingDefaults,
  writingFragment,
} from "../shared/fragments"
import { generationOptionDefaults } from "../shared/options"
import { validateLink } from "../shared/links"
import { resolveCreateBrandedImages } from "../shared/payload"

/**
 * Scheduled-job form. The form state is *flat* — the blog settings sit at the top level next
 * to `name` and `schedule`, so the shared field components (which address `imageSource`,
 * `aiModel`, `options.*`...) work unchanged. `toJobPayload` nests them into the `blogs`
 * object the API stores, and `jobToFormValues` flattens a stored job back out.
 */

export const JOB_MAX_TEMPLATES = 7
export const JOB_MAX_BLOGS = 10

const SCHEDULE_TYPES = Object.values(ScheduleType) as [string, ...string[]]

export const jobScheduleFormSchema = z.object({
  type: z.enum(SCHEDULE_TYPES),
  customDates: z.array(z.string()),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  daysOfMonth: z.array(z.number().min(1).max(31)),
})

export const jobFormSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter a job name."),
    status: z.enum(["active", "stop"]),
    schedule: jobScheduleFormSchema,

    templates: z.array(z.string()),
    topics: z.array(z.string()),
    /** `undefined` while the box is empty; the range rule reports it with the usual copy. */
    numberOfBlogs: z.number({ error: `Number of blogs must be between 1 and ${JOB_MAX_BLOGS}.` }),
    keywords: keywordsFragment.keywords,
    ...referenceLinksFragment,

    ...writingFragment,
    ...aiFragment,
    imageSource: imageSourceSchema,
    numberOfImages: z.number({ error: "Number of images must be a number." }),
    ...brandFragment,
    ...postingFragment,
    ...optionsFragment,

    // ---- form-only: validated here, never sent ----
    templateIds: z.array(z.number()),
  })
  .superRefine((values, ctx) => {
    const { schedule } = values

    if (values.templates.length === 0) {
      ctx.addIssue({
        path: ["templates"],
        code: "custom",
        message: "Please select at least one template.",
      })
    } else if (values.templates.length > JOB_MAX_TEMPLATES) {
      ctx.addIssue({
        path: ["templates"],
        code: "custom",
        message: `You can select a maximum of ${JOB_MAX_TEMPLATES} templates.`,
      })
    }

    if (values.topics.length === 0) {
      ctx.addIssue({ path: ["topics"], code: "custom", message: "Please add at least one topic." })
    }

    refineKeywords({ ...values, focusKeywords: [] }, ctx, { focusRequired: false })

    if (values.numberOfBlogs < 1 || values.numberOfBlogs > JOB_MAX_BLOGS) {
      ctx.addIssue({
        path: ["numberOfBlogs"],
        code: "custom",
        message: `Number of blogs must be between 1 and ${JOB_MAX_BLOGS}.`,
      })
    }

    if (values.numberOfImages < 0 || values.numberOfImages > BLOG_CONFIG.IMAGES.MAX_COUNT) {
      ctx.addIssue({
        path: ["numberOfImages"],
        code: "custom",
        message: `Number of images must be between 0 and ${BLOG_CONFIG.IMAGES.MAX_COUNT}.`,
      })
    }

    values.referenceLinks.forEach((link, index) => {
      const problem = validateLink(link, "reference")
      if (problem) ctx.addIssue({ path: ["referenceLinks", index], code: "custom", message: problem })
    })

    // A schedule with no days selected would never fire.
    if (schedule.type === ScheduleType.WEEKLY && schedule.daysOfWeek.length === 0) {
      ctx.addIssue({
        path: ["schedule", "daysOfWeek"],
        code: "custom",
        message: "Please select at least one day of the week.",
      })
    }
    if (schedule.type === ScheduleType.MONTHLY && schedule.daysOfMonth.length === 0) {
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

    refineBrand(values, ctx)
    refinePosting(values, ctx)
  })

export type JobFormValues = z.input<typeof jobFormSchema>

export const jobFormDefaults: JobFormValues = {
  name: "",
  status: "active",
  schedule: { type: ScheduleType.DAILY, customDates: [], daysOfWeek: [], daysOfMonth: [] },
  templates: [],
  topics: [],
  numberOfBlogs: 1,
  keywords: [],
  ...referenceLinksDefaults,
  tone: TONES[0],
  ...writingDefaults,
  aiModel: "gemini",
  costCutter: true,
  imageSource: IMAGE_SOURCE.STOCK as JobFormValues["imageSource"],
  numberOfImages: 0,
  ...brandDefaults,
  ...postingDefaults,
  // Jobs have always appended a call-to-action unless told not to.
  options: generationOptionDefaults({ addCTA: true }),
  templateIds: [],
}

/**
 * A job loaded from the API → form state. The API returns canonical key names (the backend
 * normalizes jobs saved before the unification), so this only has to flatten and repair:
 * a populated brand reference comes back as an object on some responses, a schedule type
 * the enum never had can survive in old documents, and the template grid tracks selection
 * by id although the job stores names.
 */
export function jobToFormValues(job: Record<string, any> | null | undefined): JobFormValues {
  if (!job) return jobFormDefaults

  const blogs = job.blogs ?? {}
  const schedule = { ...jobFormDefaults.schedule, ...(job.schedule ?? {}) }
  const templates: string[] = blogs.templates ?? []
  const brandId =
    typeof blogs.brandId === "object" && blogs.brandId !== null
      ? (blogs.brandId._id ?? null)
      : (blogs.brandId ?? null)

  return {
    ...jobFormDefaults,
    name: job.name ?? "",
    status: job.status === "active" ? "active" : "stop",
    schedule: {
      ...schedule,
      type: SCHEDULE_TYPES.includes(schedule.type) ? schedule.type : ScheduleType.DAILY,
    },
    templates,
    topics: blogs.topics ?? [],
    numberOfBlogs: blogs.numberOfBlogs ?? 1,
    keywords: blogs.keywords ?? [],
    referenceLinks: blogs.referenceLinks ?? [],
    tone: blogs.tone ?? jobFormDefaults.tone,
    userDefinedLength: blogs.userDefinedLength ?? jobFormDefaults.userDefinedLength,
    languageToWrite: blogs.languageToWrite ?? jobFormDefaults.languageToWrite,
    aiModel: blogs.aiModel ?? jobFormDefaults.aiModel,
    costCutter: blogs.costCutter ?? true,
    imageSource: blogs.imageSource ?? jobFormDefaults.imageSource,
    numberOfImages: blogs.numberOfImages ?? 0,
    isCheckedBrand: !!blogs.isCheckedBrand,
    brandId,
    postingDefaultType: blogs.postingDefaultType ?? null,
    options: { ...jobFormDefaults.options, ...(job.options ?? {}) },
    // In stored order: the grid echoes ids back as names, and a different order would read as
    // an edit the user never made.
    templateIds: templates.flatMap((name) => packages.find((p) => p.name === name)?.id ?? []),
  }
}

/** Form state → request body for POST/PUT /jobs. */
export function toJobPayload(values: JobFormValues) {
  const imagesOn = values.imageSource !== IMAGE_SOURCE.NONE

  return buildPayload("Job", jobFinalDataSchema, {
    name: values.name.trim(),
    status: values.status,
    schedule: {
      type: values.schedule.type,
      customDates: values.schedule.customDates,
      daysOfWeek: values.schedule.daysOfWeek,
      daysOfMonth: values.schedule.daysOfMonth,
    },
    blogs: {
      templates: values.templates,
      topics: values.topics,
      keywords: values.keywords,
      referenceLinks: values.referenceLinks,
      numberOfBlogs: values.numberOfBlogs,
      tone: values.tone,
      userDefinedLength: values.userDefinedLength,
      languageToWrite: values.languageToWrite,
      aiModel: values.aiModel,
      costCutter: values.costCutter,
      imageSource: values.imageSource,
      numberOfImages: imagesOn ? values.numberOfImages : 0,
      isCheckedBrand: values.isCheckedBrand,
      brandId: values.isCheckedBrand ? values.brandId || null : null,
      postingDefaultType: includeIf(values.options.automaticPosting, values.postingDefaultType) ?? null,
    },
    options: { ...values.options, createBrandedImages: resolveCreateBrandedImages(values) },
  })
}
