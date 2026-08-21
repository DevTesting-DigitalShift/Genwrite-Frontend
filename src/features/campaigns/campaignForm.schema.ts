import { z } from "zod"

const keywordTargetSchema = z.object({
  keyword: z.string().trim().min(1, "Keyword is required"),
  targetPosition: z.number().positive().nullable(),
  targetClicks: z.number().nonnegative().nullable(),
})

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Campaign name is required"),
    description: z.string().trim(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    blogIds: z.array(z.string()),
    targets: z.object({
      clicks: z.number().nonnegative().nullable(),
      impressions: z.number().nonnegative().nullable(),
      avgPosition: z.number().positive().nullable(),
      keywords: z.array(keywordTargetSchema),
    }),
    automation: z.object({
      autoSuggest: z.boolean(),
      autoApply: z.boolean(),
      autoRepost: z.boolean(),
      maxAutoActionsPerWeek: z.number().int().positive(),
    }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
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
