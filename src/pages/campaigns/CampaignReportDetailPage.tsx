import { Helmet } from "react-helmet"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Mail, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { Button } from "@components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card"
import { Badge } from "@components/ui/badge"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import type { CampaignMetrics, ProgressStatusType } from "@/types/campaign"

const PROGRESS_LABEL: Record<ProgressStatusType, string> = {
  on_track: "On track",
  behind: "Behind target",
  ahead: "Ahead of target",
  "n/a": "No target set",
}

const PROGRESS_BADGE: Record<ProgressStatusType, string> = {
  on_track: "bg-blue-100 text-blue-700 border-blue-200",
  behind: "bg-red-100 text-red-700 border-red-200",
  ahead: "bg-green-100 text-green-700 border-green-200",
  "n/a": "bg-gray-100 text-gray-700 border-gray-200",
}

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-gray-100 text-gray-700 border-gray-200",
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

function DeltaIndicator({ value, lowerIsBetter = false }: { value: number; lowerIsBetter?: boolean }) {
  if (!value) return <Minus className="size-3.5 text-muted-foreground" />
  const positive = value > 0
  const better = lowerIsBetter ? !positive : positive
  const Icon = better ? TrendingUp : TrendingDown
  return (
    <span className={`flex items-center gap-0.5 text-xs ${better ? "text-green-600" : "text-red-600"}`}>
      <Icon className="size-3.5" />
      {positive ? "+" : ""}
      {value}
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
    <Card>
      <CardContent className="pt-6 space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          <DeltaIndicator value={delta} lowerIsBetter={lowerIsBetter} />
        </div>
        <Badge className={PROGRESS_BADGE[progress]}>{PROGRESS_LABEL[progress]}</Badge>
      </CardContent>
    </Card>
  )
}

export default function CampaignReportDetailPage() {
  const { id, reportId } = useParams<{ id: string; reportId: string }>()
  const navigate = useNavigate()
  const { data: campaign } = campaignsQuery.useDetail(id ?? "")
  const { data: report, isLoading } = campaignsQuery.useReport(id ?? "", reportId ?? "")

  if (isLoading || !report) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const metrics: CampaignMetrics = report.metrics

  return (
    <main className="max-container mx-auto space-y-6 p-4 sm:p-6 md:p-10">
      <Helmet>
        <title>Report — {campaign?.name ?? "Campaign"} | GenWrite</title>
      </Helmet>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/campaigns/${id}`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
          </h1>
          <p className="text-sm text-muted-foreground">{campaign?.name}</p>
        </div>
        {report.emailSentAt && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Mail className="size-3.5" /> Sent {formatDate(report.emailSentAt)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Clicks"
          value={metrics.clicks}
          delta={report.deltaVsPreviousMonth.clicks}
          progress={report.progressVsTarget.clicks}
        />
        <MetricCard
          label="Impressions"
          value={metrics.impressions}
          delta={report.deltaVsPreviousMonth.impressions}
          progress={report.progressVsTarget.impressions}
        />
        <MetricCard
          label="Avg. position"
          value={metrics.avgPosition}
          delta={report.deltaVsPreviousMonth.avgPosition}
          progress={report.progressVsTarget.avgPosition}
          lowerIsBetter
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top suggestions</CardTitle>
          <CardDescription>Pending AI suggestions generated for this campaign this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.topSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No open suggestions this period.</p>
          ) : (
            <div className="space-y-3">
              {report.topSuggestions.map((s) => (
                <div
                  key={s.insightId}
                  className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm flex-1">{s.summary}</p>
                  <Badge className={PRIORITY_BADGE[s.priority]}>{s.priority}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automatic actions taken</CardTitle>
          <CardDescription>Rewrites/reposts the campaign applied on your behalf this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.actionsTaken.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No automatic actions taken this period.</p>
          ) : (
            <div className="space-y-3">
              {report.actionsTaken.map((a) => (
                <div
                  key={`${a.blogId}-${a.at}`}
                  className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0 text-sm"
                >
                  <span className="capitalize">{a.action}</span>
                  <span className="text-muted-foreground">{formatDate(a.at)}</span>
                  <span className="text-muted-foreground">{a.creditsCost} credits</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
