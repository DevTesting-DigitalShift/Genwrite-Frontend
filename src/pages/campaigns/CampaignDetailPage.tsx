import { Helmet } from "react-helmet"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Calendar, FileStack, Loader2, Pencil, Target } from "lucide-react"
import { Button } from "@components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card"
import { Badge } from "@components/ui/badge"
import { Progress } from "@components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { CampaignFormDialog } from "@/features/campaigns/CampaignFormDialog"
import { useCampaignFormUI } from "@/features/campaigns/campaignForm.reducer"
import type { CampaignStatusType } from "@/types/campaign"

const STATUS_BADGE: Record<CampaignStatusType, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

function targetProgress(current: number | undefined, target: number | null) {
  if (target == null || target <= 0 || current == null) return null
  return Math.min(100, Math.round((current / target) * 100))
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: campaigns = [] } = campaignsQuery.useList()
  const { data: campaign, isLoading } = campaignsQuery.useDetail(id ?? "")
  const { data: reports = [], isLoading: isReportsLoading } = campaignsQuery.useReports(id ?? "")
  const { state: uiState, actions } = useCampaignFormUI()

  if (isLoading || !campaign) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const latestReport = reports[0]
  const clicksProgress = targetProgress(latestReport?.metrics.clicks, campaign.targets.clicks)
  const impressionsProgress = targetProgress(
    latestReport?.metrics.impressions,
    campaign.targets.impressions
  )

  return (
    <main className="max-container mx-auto space-y-6 p-4 sm:p-6 md:p-10">
      <Helmet>
        <title>{campaign.name} | Campaigns | GenWrite</title>
      </Helmet>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/campaigns")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{campaign.name}</h1>
            <Badge className={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => actions.openEdit(campaign._id)}>
          <Pencil className="size-4" /> Edit
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="size-4" />
          {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
        </span>
        <span className="flex items-center gap-1">
          <FileStack className="size-4" />
          {campaign.blogIds.length} blog{campaign.blogIds.length === 1 ? "" : "s"} assigned
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" /> Targets
          </CardTitle>
          <CardDescription>
            Progress fills in once the weekly job has aggregated GSC data for this campaign's blogs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.targets.clicks == null &&
          campaign.targets.impressions == null &&
          campaign.targets.avgPosition == null ? (
            <p className="text-sm text-muted-foreground">No aggregate targets set.</p>
          ) : (
            <>
              {campaign.targets.clicks != null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Clicks</span>
                    <span className="text-muted-foreground">
                      {latestReport ? `${latestReport.metrics.clicks} / ` : ""}
                      Target: {campaign.targets.clicks}
                    </span>
                  </div>
                  {clicksProgress != null ? (
                    <Progress value={clicksProgress} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No report yet — progress shows after the first monthly report.</p>
                  )}
                </div>
              )}
              {campaign.targets.impressions != null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Impressions</span>
                    <span className="text-muted-foreground">
                      {latestReport ? `${latestReport.metrics.impressions} / ` : ""}
                      Target: {campaign.targets.impressions}
                    </span>
                  </div>
                  {impressionsProgress != null ? (
                    <Progress value={impressionsProgress} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No report yet — progress shows after the first monthly report.</p>
                  )}
                </div>
              )}
              {campaign.targets.avgPosition != null && (
                <div className="flex justify-between text-sm">
                  <span>Avg. position</span>
                  <span className="text-muted-foreground">Target: {campaign.targets.avgPosition}</span>
                </div>
              )}
            </>
          )}

          {campaign.targets.keywords.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Keyword targets</p>
              <div className="flex flex-wrap gap-2">
                {campaign.targets.keywords.map((kw) => (
                  <Badge key={kw.keyword} variant="secondary">
                    {kw.keyword}
                    {kw.targetPosition != null && ` · pos ≤${kw.targetPosition}`}
                    {kw.targetClicks != null && ` · ${kw.targetClicks} clicks`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={campaign.automation.autoSuggest ? "default" : "outline"}>
            Auto-suggest {campaign.automation.autoSuggest ? "on" : "off"}
          </Badge>
          <Badge variant={campaign.automation.autoApply ? "default" : "outline"}>
            Auto-apply {campaign.automation.autoApply ? "on" : "off"}
          </Badge>
          <Badge variant={campaign.automation.autoRepost ? "default" : "outline"}>
            Auto-repost {campaign.automation.autoRepost ? "on" : "off"}
          </Badge>
          <Badge variant="outline">Max {campaign.automation.maxAutoActionsPerWeek}/week</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly reports</CardTitle>
          <CardDescription>Generated on the 1st of each month from the prior month's data.</CardDescription>
        </CardHeader>
        <CardContent>
          {isReportsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No reports generated yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Avg. position</TableHead>
                  <TableHead>Suggestions</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report._id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/campaigns/${campaign._id}/reports/${report._id}`)}
                  >
                    <TableCell>{formatDate(report.periodStart)}</TableCell>
                    <TableCell>{report.metrics.clicks}</TableCell>
                    <TableCell>{report.metrics.impressions}</TableCell>
                    <TableCell>{report.metrics.avgPosition}</TableCell>
                    <TableCell>{report.topSuggestions.length}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
