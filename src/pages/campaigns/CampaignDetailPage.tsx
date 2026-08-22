import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { Helmet } from "react-helmet"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  FileStack,
  FileText,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react"
import { Button } from "@components/ui/button"
import { Progress } from "@components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs"
import { cn } from "@/lib/utils"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { useAllBlogsQuery } from "@api/queries/blogQueries"
import { COSTS } from "@/data/blogData"
import { CampaignFormDialog } from "@/features/campaigns/CampaignFormDialog"
import { useCampaignFormUI } from "@/features/campaigns/campaignForm.reducer"
import { CampaignStatusControl } from "@/features/campaigns/CampaignStatusControl"
import { LiveMetricsWidget } from "@/features/campaigns/LiveMetricsWidget"
import { CampaignSuggestionsPanel } from "@/features/campaigns/CampaignSuggestionsPanel"
import { CampaignActivityLog } from "@/features/campaigns/CampaignActivityLog"
import { PanelEmpty, PanelError, PanelLoading } from "@/features/campaigns/CampaignStates"
import { useCreditConfirm } from "@/features/campaigns/useCreditConfirm"
import { getFriendlyError } from "@utils/friendlyError"
import type { CampaignStatusType } from "@/types/campaign"

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

const formatNumber = (value: number) => value.toLocaleString("en-US")

function targetProgress(current: number | undefined, target: number | null) {
  if (target == null || target <= 0 || current == null) return null
  return Math.min(100, Math.round((current / target) * 100))
}

/** A soft filled panel — the page groups by surface and spacing rather than by outlines. */
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

/** One headline metric: where it stands now, what it's aiming at, how far along. */
function TargetTile({
  label,
  current,
  target,
  progress,
  hint,
  lowerIsBetter,
}: {
  label: string
  current?: number
  target: number
  progress?: number | null
  hint?: string
  lowerIsBetter?: boolean
}) {
  return (
    <div className="rounded-xl bg-background p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold leading-none text-foreground">
        {current != null ? formatNumber(current) : "—"}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {lowerIsBetter ? "Target: ≤" : "Target: "}
        {formatNumber(target)}
      </p>
      {progress != null ? (
        <div className="mt-3 space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground">{progress}% of target</p>
        </div>
      ) : (
        hint && <p className="mt-3 text-[11px] leading-snug text-muted-foreground/80">{hint}</p>
      )}
    </div>
  )
}

/** Automation setting as a labelled row with an on/off state pill. */
function AutomationRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3 shadow-sm">
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
          enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {enabled ? "On" : "Off"}
      </span>
    </div>
  )
}

export default function CampaignDetailPage() {
  const { id = "" } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState("overview")

  const { data: campaigns = [] } = campaignsQuery.useList()
  const { data: campaign, isLoading, isError, error, refetch } = campaignsQuery.useDetail(id)
  const {
    data: reports = [],
    isLoading: isReportsLoading,
    isError: isReportsError,
    error: reportsError,
    refetch: refetchReports,
  } = campaignsQuery.useReports(id)
  const { data: allBlogs = [] } = useAllBlogsQuery()
  const { state: uiState, actions } = useCampaignFormUI()
  const { confirmSpend } = useCreditConfirm()

  const blogTitles = useMemo(
    () =>
      Object.fromEntries(
        (allBlogs as { _id: string; title?: string }[]).map((b) => [b._id, b.title ?? "Untitled blog"])
      ) as Record<string, string>,
    [allBlogs]
  )

  const analyzeMutation = campaignsQuery.useAnalyze({
    onSuccess: (result) => {
      toast.success(`Analyzed ${result.analyzed} of ${result.total} blogs`)
      setTab("suggestions")
    },
    onError: (err) => toast.error(getFriendlyError(err, "campaign")),
  })

  const reportMutation = campaignsQuery.useGenerateReport({
    onSuccess: () => toast.success("Report generated"),
    onError: (err) => toast.error(getFriendlyError(err, "campaign")),
  })

  const statusMutation = campaignsQuery.useUpdateStatus({
    onSuccess: (updated) => toast.success(`Campaign ${updated.status}`),
    onError: (err) => toast.error(getFriendlyError(err, "campaign")),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !campaign) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4">
        <PanelError
          title="Couldn't load this campaign"
          description={getFriendlyError(error, "campaign")}
          onRetry={() => refetch()}
        />
        <Button variant="outline" onClick={() => navigate("/campaigns")}>
          Back to campaigns
        </Button>
      </div>
    )
  }

  const { targets, automation, blogIds } = campaign
  const latestReport = reports[0]
  const hasAggregateTargets =
    targets.clicks != null || targets.impressions != null || targets.avgPosition != null
  const pendingHint = "Fills in after the first monthly report."
  const analyzeCost = COSTS.BLOG_INSIGHT.ANALYZE * Math.max(blogIds.length, 1)

  const handleAnalyze = () => {
    if (blogIds.length === 0) {
      toast.error("Assign at least one blog to this campaign first.")
      return
    }
    confirmSpend({
      title: "Analyze now",
      description: `The AI will review all ${blogIds.length} blog${blogIds.length === 1 ? "" : "s"} in this campaign against their Search Console data.`,
      cost: analyzeCost,
      confirmText: "Analyze",
      onConfirm: () => analyzeMutation.mutate(campaign._id),
    })
  }

  const handleGenerateReport = () => {
    reportMutation.mutate({ campaignId: campaign._id, payload: { sendEmail: false } })
  }

  const handleStatusChange = (status: CampaignStatusType) => {
    statusMutation.mutate({ campaignId: campaign._id, status })
  }

  return (
    <main className="max-container mx-auto space-y-6 p-4 sm:p-6 md:p-10">
      <Helmet>
        <title>{campaign.name} | Campaigns | GenWrite</title>
      </Helmet>

      <header className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/campaigns")}
          className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All campaigns
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{campaign.name}</h1>
              <CampaignStatusControl
                status={campaign.status}
                onChange={handleStatusChange}
                isPending={statusMutation.isPending}
              />
            </div>
            {campaign.description && (
              <p className="max-w-2xl text-sm text-muted-foreground">{campaign.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <FileStack className="size-4" />
                {blogIds.length} blog{blogIds.length === 1 ? "" : "s"} assigned
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={handleGenerateReport}
              disabled={reportMutation.isPending}
            >
              {reportMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              Generate report
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Analyze now
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Edit campaign"
              onClick={() => actions.openEdit(campaign._id)}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <Section title="Live performance" description="Current Search Console data for this campaign's blogs.">
            <LiveMetricsWidget campaignId={campaign._id} />
          </Section>

          <Section
            title="Targets"
            description="Progress compares the latest monthly report against the goals set for this campaign."
          >
            {!hasAggregateTargets && targets.keywords.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No targets set for this campaign.</p>
            ) : (
              <div className="space-y-5">
                {hasAggregateTargets && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {targets.clicks != null && (
                      <TargetTile
                        label="Clicks"
                        current={latestReport?.metrics.clicks}
                        target={targets.clicks}
                        progress={targetProgress(latestReport?.metrics.clicks, targets.clicks)}
                        hint={pendingHint}
                      />
                    )}
                    {targets.impressions != null && (
                      <TargetTile
                        label="Impressions"
                        current={latestReport?.metrics.impressions}
                        target={targets.impressions}
                        progress={targetProgress(
                          latestReport?.metrics.impressions,
                          targets.impressions
                        )}
                        hint={pendingHint}
                      />
                    )}
                    {targets.avgPosition != null && (
                      <TargetTile
                        label="Avg. position"
                        current={latestReport?.metrics.avgPosition}
                        target={targets.avgPosition}
                        hint={pendingHint}
                        lowerIsBetter
                      />
                    )}
                  </div>
                )}

                {targets.keywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Keyword targets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {targets.keywords.map((kw) => (
                        <span
                          key={kw.keyword}
                          className="rounded-full bg-background px-3 py-1 text-xs font-medium shadow-sm"
                        >
                          {kw.keyword}
                          {(kw.targetPosition != null || kw.targetClicks != null) && (
                            <span className="ml-1.5 text-muted-foreground">
                              {kw.targetPosition != null && `pos ≤${kw.targetPosition}`}
                              {kw.targetPosition != null && kw.targetClicks != null && " · "}
                              {kw.targetClicks != null && `${formatNumber(kw.targetClicks)} clicks`}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="Automation">
            <div className="grid gap-2 sm:grid-cols-2">
              <AutomationRow label="Auto-suggest" enabled={automation.autoSuggest} />
              <AutomationRow label="Auto-apply rewrites" enabled={automation.autoApply} />
              <AutomationRow label="Auto-repost" enabled={automation.autoRepost} />
              <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3 shadow-sm">
                <span className="text-sm font-medium">Max auto-actions</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {automation.maxAutoActionsPerWeek}/week
                </span>
              </div>
            </div>
          </Section>

          <Section
            title="Monthly reports"
            description="Generated on the 1st of each month from the prior month's data."
          >
            {isReportsLoading ? (
              <PanelLoading label="Loading reports…" />
            ) : isReportsError ? (
              <PanelError
                title="Couldn't load reports"
                description={getFriendlyError(reportsError, "campaign")}
                onRetry={() => refetchReports()}
              />
            ) : reports.length === 0 ? (
              <PanelEmpty
                icon={FileText}
                title="No reports yet"
                description="The first report arrives next month, or you can generate one now."
                action={
                  <Button size="sm" variant="outline" onClick={handleGenerateReport}>
                    Generate report
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report._id}
                    type="button"
                    onClick={() => navigate(`/campaigns/${campaign._id}/reports/${report._id}`)}
                    className="flex w-full items-center gap-3 rounded-xl bg-background p-4 text-left shadow-sm transition-colors hover:bg-primary/5 sm:gap-4"
                  >
                    <span className="w-24 shrink-0 text-sm font-semibold sm:w-32">
                      {formatDate(report.periodStart)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground sm:gap-x-6">
                      <span>
                        <span className="font-semibold text-foreground">
                          {formatNumber(report.metrics.clicks)}
                        </span>{" "}
                        clicks
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">
                          {formatNumber(report.metrics.impressions)}
                        </span>{" "}
                        impressions
                      </span>
                      <span className="hidden sm:inline">
                        pos{" "}
                        <span className="font-semibold text-foreground">
                          {report.metrics.avgPosition}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <Section
            title="Pending suggestions"
            description="AI recommendations for this campaign's blogs. Reviewing a rewrite spends credits; nothing is saved until you accept it."
          >
            <CampaignSuggestionsPanel
              campaignId={campaign._id}
              blogTitles={blogTitles}
              onAnalyze={handleAnalyze}
              isAnalyzing={analyzeMutation.isPending}
            />
          </Section>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Section
            title="Action log"
            description="Every rewrite and repost this campaign's automation has run."
          >
            <CampaignActivityLog campaignId={campaign._id} blogTitles={blogTitles} />
          </Section>
        </TabsContent>
      </Tabs>

      <CampaignFormDialog
        uiState={uiState}
        onClose={actions.close}
        onTabChange={actions.setTab}
        onBlogSearchChange={actions.setBlogSearch}
        campaigns={campaigns}
      />
    </main>
  )
}
