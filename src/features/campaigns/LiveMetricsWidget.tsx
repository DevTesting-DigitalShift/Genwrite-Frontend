import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { PanelError, PanelLoading } from "./CampaignStates"
import type { ProgressStatusType } from "@/types/campaign"

const PROGRESS_PILL: Record<ProgressStatusType, string> = {
  on_track: "bg-primary/10 text-primary",
  ahead: "bg-emerald-100 text-emerald-700",
  behind: "bg-red-100 text-red-700",
  "n/a": "bg-muted text-muted-foreground",
}

const PROGRESS_LABEL: Record<ProgressStatusType, string> = {
  on_track: "On track",
  ahead: "Ahead",
  behind: "Behind",
  "n/a": "No target",
}

const formatNumber = (value: number) => value.toLocaleString("en-US")

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })

function MetricTile({
  label,
  value,
  progress,
}: {
  label: string
  value: string
  progress?: ProgressStatusType
}) {
  return (
    <div className="rounded-xl bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {progress && progress !== "n/a" && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              PROGRESS_PILL[progress]
            )}
          >
            {PROGRESS_LABEL[progress]}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold leading-none">{value}</p>
    </div>
  )
}

/**
 * Current-period GSC numbers, straight from the live endpoint — the monthly report
 * is a snapshot, this is where the campaign stands right now.
 */
export function LiveMetricsWidget({ campaignId }: { campaignId: string }) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = campaignsQuery.useMetrics(campaignId)

  if (isLoading) return <PanelLoading label="Fetching live metrics…" />

  if (isError || !data) {
    return (
      <PanelError
        title="Couldn't load live metrics"
        description="Search Console data may not be connected for these blogs yet."
        onRetry={() => refetch()}
      />
    )
  }

  const { metrics, progressVsTarget, from, to } = data

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Activity className="size-3.5" />
        {formatDate(from)} – {formatDate(to)}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Clicks"
          value={formatNumber(metrics.clicks)}
          progress={progressVsTarget.clicks}
        />
        <MetricTile
          label="Impressions"
          value={formatNumber(metrics.impressions)}
          progress={progressVsTarget.impressions}
        />
        <MetricTile
          label="Avg. position"
          value={metrics.avgPosition.toFixed(1)}
          progress={progressVsTarget.avgPosition}
        />
        <MetricTile label="CTR" value={`${(metrics.ctr * 100).toFixed(2)}%`} />
      </div>
    </div>
  )
}
