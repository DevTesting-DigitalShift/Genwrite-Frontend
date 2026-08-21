export const CampaignStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
} as const

export type CampaignStatusType = (typeof CampaignStatus)[keyof typeof CampaignStatus]

export const ProgressStatus = {
  ON_TRACK: "on_track",
  BEHIND: "behind",
  AHEAD: "ahead",
  NOT_APPLICABLE: "n/a",
} as const

export type ProgressStatusType = (typeof ProgressStatus)[keyof typeof ProgressStatus]

export const SuggestionPriority = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const

export type SuggestionPriorityType = (typeof SuggestionPriority)[keyof typeof SuggestionPriority]

export interface KeywordTarget {
  keyword: string
  targetPosition: number | null
  targetClicks: number | null
}

export interface CampaignTargets {
  clicks: number | null
  impressions: number | null
  avgPosition: number | null
  keywords: KeywordTarget[]
}

export interface CampaignAutomation {
  autoSuggest: boolean
  autoApply: boolean
  autoRepost: boolean
  maxAutoActionsPerWeek: number
}

/** Minimal shape needed to render a blog in a picker/list — not the full Blog record. */
export interface CampaignBlogRef {
  _id: string
  title: string
}

export interface Campaign {
  _id: string
  userId: string
  name: string
  description: string
  status: CampaignStatusType
  startDate: string
  endDate: string
  blogIds: string[]
  targets: CampaignTargets
  automation: CampaignAutomation
  createdAt: string
  updatedAt: string
}

export interface CampaignMetrics {
  clicks: number
  impressions: number
  avgPosition: number
  ctr: number
}

export interface CampaignProgressVsTarget {
  clicks: ProgressStatusType
  impressions: ProgressStatusType
  avgPosition: ProgressStatusType
}

export interface CampaignSuggestionRef {
  blogId: string
  insightId: string
  summary: string
  priority: SuggestionPriorityType
}

export interface CampaignActionTaken {
  blogId: string
  action: "rewrite" | "repost"
  insightId: string | null
  creditsCost: number
  at: string
}

/** Full CampaignActionLog document, as returned by GET /campaigns/:id/actions —
 * richer than the CampaignActionTaken snapshot embedded in a report (includes
 * failures, not just successes). */
export interface CampaignActionLogEntry {
  _id: string
  campaignId: string
  blogId: string
  userId: string
  action: "rewrite" | "repost"
  insightId: string | null
  creditsCost: number
  status: "success" | "failed"
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface CampaignAnalyzeResultItem {
  blogId: string
  status: "success" | "failed"
  insightId?: string
  suggestionCount?: number
  error?: string
}

export interface CampaignAnalyzeResult {
  analyzed: number
  total: number
  results: CampaignAnalyzeResultItem[]
}

export interface CampaignLiveMetrics {
  from: string
  to: string
  metrics: CampaignMetrics
  progressVsTarget: CampaignProgressVsTarget
}

/** A live pending suggestion — richer than CampaignSuggestionRef (the report snapshot),
 * since it comes straight from the BlogInsight document. */
export interface CampaignLiveSuggestion {
  blogId: string
  insightId: string
  suggestionId: string
  generatedAt: string
  sectionTitle: string
  issue: string
  recommendation: string
  priority: SuggestionPriorityType
}

export interface CampaignReport {
  _id: string
  campaignId: string
  userId: string
  periodStart: string
  periodEnd: string
  metrics: CampaignMetrics
  deltaVsPreviousMonth: CampaignMetrics
  progressVsTarget: CampaignProgressVsTarget
  topSuggestions: CampaignSuggestionRef[]
  actionsTaken: CampaignActionTaken[]
  emailSentAt: string | null
  createdAt: string
  updatedAt: string
}
