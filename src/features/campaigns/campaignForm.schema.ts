import { z } from "zod"

const keywordTargetSchema = z.object({
  keyword: z.string().trim().min(1, "Keyword is required"),
  targetPosition: z
    .number({ message: "Enter a number" })
    .positive("Position must be 1 or higher")
    .nullable(),
  targetClicks: z.number({ message: "Enter a number" }).nonnegative("Can't be negative").nullable(),
})

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Campaign name is required"),
    description: z
      .string()
      .trim()
      .min(1, "Describe what this campaign is for")
      .max(500, "Keep the description under 500 characters"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    blogIds: z.array(z.string()).min(1, "Select at least one published blog to track"),
    targets: z
      .object({
        clicks: z.number({ message: "Enter a number" }).nonnegative("Can't be negative").nullable(),
        impressions: z
          .number({ message: "Enter a number" })
          .nonnegative("Can't be negative")
          .nullable(),
        avgPosition: z
          .number({ message: "Enter a number" })
          .positive("Position must be 1 or higher")
          .nullable(),
        keywords: z.array(keywordTargetSchema),
      })
      // Progress is measured against targets — with none set, every metric reports
      // "n/a" forever and the campaign can never be on track or behind. One is enough.
      .refine(
        (targets) =>
          targets.clicks !== null ||
          targets.impressions !== null ||
          targets.avgPosition !== null ||
          targets.keywords.length > 0,
        { message: "Set at least one target — clicks, impressions, position, or a keyword" }
      ),
    automation: z.object({
      autoSuggest: z.boolean(),
      autoApply: z.boolean(),
      autoRepost: z.boolean(),
      maxAutoActionsPerWeek: z
        .number({ message: "Enter a number" })
        .int("Must be a whole number")
        .positive("Must be at least 1")
        .max(50, "50 auto-actions a week is the maximum"),
    }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  // Auto-suggest is what produces the suggestions the other two act on, so with it
  // off they are dead switches rather than merely inert ones.
  .refine((data) => !data.automation.autoApply || data.automation.autoSuggest, {
    message: "Auto-apply needs auto-suggest enabled",
    path: ["automation", "autoApply"],
  })
  .refine((data) => !data.automation.autoRepost || data.automation.autoApply, {
    message: "Auto-repost requires auto-apply to be enabled",
    path: ["automation", "autoRepost"],
  })

export type CampaignFormValues = z.infer<typeof campaignFormSchema>

export const campaignFormDefaultValues: CampaignFormValues = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  blogIds: [],
  targets: { clicks: null, impressions: null, avgPosition: null, keywords: [] },
  automation: { autoSuggest: true, autoApply: false, autoRepost: false, maxAutoActionsPerWeek: 3 },
}
