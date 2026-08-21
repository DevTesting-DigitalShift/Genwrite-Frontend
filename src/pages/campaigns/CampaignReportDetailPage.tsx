import type { ReactNode } from "react"
import { Helmet } from "react-helmet"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Lightbulb, Loader2, Mail, Minus, TrendingDown, TrendingUp, Zap } from "lucide-react"
import { Button } from "@components/ui/button"
import { cn } from "@/lib/utils"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { PanelEmpty, PanelError } from "@/features/campaigns/CampaignStates"
import type { ProgressStatusType, SuggestionPriorityType } from "@/types/campaign"

const PROGRESS_LABEL: Record<ProgressStatusType, string> = {
  on_track: "On track",
  behind: "Behind target",
  ahead: "Ahead of target",
  "n/a": "No target set",
}

const PROGRESS_PILL: Record<ProgressStatusType, string> = {
  on_track: "bg-primary/10 text-primary",
  behind: "bg-red-100 text-red-700",
  ahead: "bg-emerald-100 text-emerald-700",
  "n/a": "bg-muted text-muted-foreground",
}

const PRIORITY_PILL: Record<SuggestionPriorityType, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

const formatNumber = (value: number) => value.toLocaleString("en-US")

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-muted/40 p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function DeltaIndicator({
  value,
  lowerIsBetter = false,
}: {
  value: number
  lowerIsBetter?: boolean
}) {
  if (!value) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3.5" /> no change
      </span>
    )
  }
  const positive = value > 0
  const better = lowerIsBetter ? !positive : positive
  const Icon = better ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        better ? "text-emerald-600" : "text-red-600"
      )}
    >
      <Icon className="size-3.5" />
      {positive ? "+" : ""}
      {formatNumber(value)}
    </span>
  )
}

function MetricCard({
  label,
  value,
  delta,
  progress,
  lowerIsBetter = false,
}: {
  label: string
  value: number
  delta: number
  progress: ProgressStatusType
  lowerIsBetter?: boolean
}) {
  return (
    <div className="rounded-xl bg-background p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-bold leading-none">{formatNumber(value)}</span>
        <DeltaIndicator value={delta} lowerIsBetter={lowerIsBetter} />
      </div>
      <span
        className={cn(
          "mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
          PROGRESS_PILL[progress]
        )}
      >
        {PROGRESS_LABEL[progress]}
      </span>
    </div>
  )
}

export default function CampaignReportDetailPage() {
  const { id = "", reportId = "" } = useParams<{ id: string; reportId: string }>()
  const navigate = useNavigate()
  const { data: campaign } = campaignsQuery.useDetail(id)
  const { data: report, isLoading, isError, refetch } = campaignsQuery.useReport(id, reportId)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !report) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4">
        <PanelError
          title="Couldn't load this report"
          description="It may have been removed, or the connection dropped."
          onRetry={() => refetch()}
        />
        <Button variant="outline" onClick={() => navigate(`/campaigns/${id}`)}>
          Back to campaign
        </Button>
      </div>
    )
  }

  const { metrics, deltaVsPreviousMonth, progressVsTarget } = report

  return (
    <main className="max-container mx-auto space-y-6 p-4 sm:p-6 md:p-10">
      <Helmet>
        <title>Report — {campaign?.name ?? "Campaign"} | GenWrite</title>
      </Helmet>

      <header className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(`/campaigns/${id}`)}
          className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {campaign?.name ?? "Back to campaign"}
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Compared against the previous month.
            </p>
          </div>
          {report.emailSentAt && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium shadow-sm">
              <Mail className="size-3.5 text-muted-foreground" /> Emailed{" "}
              {formatDate(report.emailSentAt)}
            </span>
          )}
        </div>
      </header>

      <Section title="Performance">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Clicks"
            value={metrics.clicks}
            delta={deltaVsPreviousMonth.clicks}
            progress={progressVsTarget.clicks}
          />
          <MetricCard
            label="Impressions"
            value={metrics.impressions}
            delta={deltaVsPreviousMonth.impressions}
            progress={progressVsTarget.impressions}
          />
          <MetricCard
            label="Avg. position"
            value={metrics.avgPosition}
            delta={deltaVsPreviousMonth.avgPosition}
            progress={progressVsTarget.avgPosition}
            lowerIsBetter
          />
        </div>
      </Section>

      <Section
        title="Top suggestions"
        description="Pending AI suggestions generated for this campaign this month."
      >
        {report.topSuggestions.length === 0 ? (
          <PanelEmpty icon={Lightbulb} title="No open suggestions this period" />
        ) : (
          <div className="space-y-2">
            {report.topSuggestions.map((s) => (
              <div
                key={s.insightId}
                className="flex items-start justify-between gap-3 rounded-xl bg-background p-4 shadow-sm"
              >
                <p className="min-w-0 flex-1 text-sm">{s.summary}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    PRIORITY_PILL[s.priority]
                  )}
                >
                  {s.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Automatic actions taken"
        description="Rewrites and reposts the campaign applied on your behalf this month."
      >
        {report.actionsTaken.length === 0 ? (
          <PanelEmpty icon={Zap} title="No automatic actions this period" />
        ) : (
          <div className="space-y-2">
            {report.actionsTaken.map((a) => (
              <div
                key={`${a.blogId}-${a.at}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-background p-4 text-sm shadow-sm"
              >
                <span className="font-medium capitalize">{a.action}</span>
                <span className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDate(a.at)}</span>
                  <span>{a.creditsCost} credits</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </main>
  )
}
