import type { FieldPath } from "react-hook-form"
import type { CampaignFormValues } from "./campaignForm.schema"
import type { CampaignFormTab } from "./campaignForm.types"

interface CampaignStep {
  id: CampaignFormTab
  label: string
  /** Validated when leaving this step, so errors surface here rather than on submit. */
  fields: FieldPath<CampaignFormValues>[]
}

/**
 * The campaign dialog is a wizard, not a set of free-form tabs: each step gates the
 * next one. Keeping the field list beside each step is what lets "Next" validate
 * only what the user can actually see.
 */
export const CAMPAIGN_STEPS: CampaignStep[] = [
  {
    id: "basics",
    label: "Basics",
    fields: ["name", "description", "startDate", "endDate"],
  },
  {
    id: "targets",
    label: "Targets",
    fields: ["targets.clicks", "targets.impressions", "targets.avgPosition", "targets.keywords"],
  },
  {
    id: "blogs",
    label: "Blogs",
    fields: ["blogIds"],
  },
  {
    id: "automation",
    label: "Automation",
    fields: [
      "automation.autoSuggest",
      "automation.autoApply",
      "automation.autoRepost",
      "automation.maxAutoActionsPerWeek",
    ],
  },
]

export const stepIndexOf = (tab: CampaignFormTab) =>
  Math.max(
    0,
    CAMPAIGN_STEPS.findIndex((step) => step.id === tab)
  )
