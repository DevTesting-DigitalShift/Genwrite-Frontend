import { useState } from "react"
import { Lightbulb, Sparkles } from "lucide-react"
import { Button } from "@components/ui/button"
import { cn } from "@/lib/utils"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { PanelEmpty, PanelError, PanelLoading } from "./CampaignStates"
import { SuggestionReviewDialog } from "./SuggestionReviewDialog"
import type { CampaignLiveSuggestion, SuggestionPriorityType } from "@/types/campaign"

const PRIORITY_PILL: Record<SuggestionPriorityType, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
}

const PRIORITY_RANK: Record<SuggestionPriorityType, number> = { high: 0, medium: 1, low: 2 }

interface CampaignSuggestionsPanelProps {
  campaignId: string
  /** blogId → title, so a suggestion can name the blog it belongs to. */
  blogTitles: Record<string, string>
  onAnalyze: () => void
  isAnalyzing: boolean
}

/** Pending AI suggestions across the campaign's blogs, each reviewable before it's applied. */
export function CampaignSuggestionsPanel({
  campaignId,
  blogTitles,
  onAnalyze,
  isAnalyzing,
}: CampaignSuggestionsPanelProps) {
  const [reviewing, setReviewing] = useState<CampaignLiveSuggestion | null>(null)
  const { data: suggestions = [], isLoading, isError, refetch } = campaignsQuery.useSuggestions(campaignId)

  if (isLoading) return <PanelLoading label="Loading suggestions…" />

  if (isError) {
    return <PanelError title="Couldn't load suggestions" onRetry={() => refetch()} />
  }

  if (suggestions.length === 0) {
    return (
      <PanelEmpty
        icon={Lightbulb}
        title="No pending suggestions"
        description="Run an analysis to have the AI review this campaign's blogs against their Search Console data."
        action={
          <Button size="sm" onClick={onAnalyze} disabled={isAnalyzing}>
            <Sparkles className="size-3.5" /> Analyze now
          </Button>
        }
      />
    )
  }

  const ordered = [...suggestions].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  )

  return (
    <>
      <div className="space-y-2">
        {ordered.map((suggestion) => (
          <div
            key={suggestion.suggestionId}
            className="rounded-xl bg-background p-4 shadow-sm transition-colors hover:bg-primary/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      PRIORITY_PILL[suggestion.priority]
                    )}
                  >
                    {suggestion.priority}
                  </span>
                  <span className="truncate text-sm font-semibold">
                    {suggestion.sectionTitle}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {blogTitles[suggestion.blogId] ?? "Untitled blog"}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{suggestion.issue}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setReviewing(suggestion)}
              >
                Review
              </Button>
            </div>
          </div>
        ))}
      </div>

      <SuggestionReviewDialog
        // Remount per suggestion so a rewrite generated for one never leaks into the next.
        key={reviewing?.suggestionId ?? "none"}
        suggestion={reviewing}
        blogTitle={reviewing ? (blogTitles[reviewing.blogId] ?? "Untitled blog") : ""}
        onClose={() => setReviewing(null)}
        onApplied={() => refetch()}
      />
    </>
  )
}
