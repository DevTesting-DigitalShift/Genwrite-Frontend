// src/api/Campaign/Campaign.query.ts
import type { AnyUseQueryOptions } from "@api/QueryBase"
import { BaseCRUDQuery } from "@api/BaseCRUDQuery"
import { CampaignAPI } from "./Campaign.api"
import type {
  Campaign,
  CampaignReport,
  CampaignStatusType,
  CampaignAnalyzeQueued,
  CampaignLiveMetrics,
  CampaignLiveSuggestion,
  CampaignActionLogEntry,
} from "@/types/campaign"

class CampaignsQuery extends BaseCRUDQuery<Campaign> {
  baseKey = ["campaigns"]
  api = CampaignAPI

  useReports = (campaignId: string, options?: AnyUseQueryOptions<CampaignReport[], Error>) =>
    this.useFetchQuery<CampaignReport[]>(
      `reports-${campaignId}`,
      () => this.api.listReports(campaignId),
      { enabled: !!campaignId, ...options }
    )

  useReport = (
    campaignId: string,
    reportId: string,
    options?: AnyUseQueryOptions<CampaignReport, Error>
  ) =>
    this.useFetchQuery<CampaignReport>(
      `report-${campaignId}-${reportId}`,
      () => this.api.getReport(campaignId, reportId),
      { enabled: !!campaignId && !!reportId, ...options }
    )

  /** Live aggregate metrics (not a monthly snapshot) — for "current progress" mid-month. */
  useMetrics = (
    campaignId: string,
    params: { from?: string; to?: string } = {},
    options?: AnyUseQueryOptions<CampaignLiveMetrics, Error>
  ) =>
    this.useParamQuery<CampaignLiveMetrics, typeof params>(
      `metrics-${campaignId}`,
      (p) => this.api.getMetrics(campaignId, p),
      params,
      { enabled: !!campaignId, ...options }
    )

  /** Live pending suggestions across every blog in the campaign. */
  useSuggestions = (campaignId: string, options?: AnyUseQueryOptions<CampaignLiveSuggestion[], Error>) =>
    this.useFetchQuery<CampaignLiveSuggestion[]>(
      `suggestions-${campaignId}`,
      () => this.api.getSuggestions(campaignId),
      { enabled: !!campaignId, ...options }
    )

  /** Audit trail of auto-applied rewrite/repost actions. */
  useActions = (campaignId: string, options?: AnyUseQueryOptions<CampaignActionLogEntry[], Error>) =>
    this.useFetchQuery<CampaignActionLogEntry[]>(
      `actions-${campaignId}`,
      () => this.api.getActions(campaignId),
      { enabled: !!campaignId, ...options }
    )

  /** Queues AI analysis for every campaign blog, instead of waiting for the weekly job.
   * Resolving means only that the job was accepted — nothing has been analyzed yet, so
   * this deliberately does NOT refresh suggestions (that would just refetch pre-analysis
   * data). Call `onAnalyzed` when the `campaign:analyzed` socket event lands. */
  useAnalyze = (options?: {
    onSuccess?: (data: CampaignAnalyzeQueued, campaignId: string) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<CampaignAnalyzeQueued, string>(
      (campaignId) => this.api.analyze(campaignId),
      options
    )

  /** Pulls in the results of a finished background analysis. Call from the
   * `campaign:analyzed` socket handler. */
  onAnalyzed = (campaignId: string) => {
    this.invalidate(`suggestions-${campaignId}`)
  }

  /** Patches a status the server changed on its own — the weekly job auto-completes
   * campaigns past their endDate. Call from the `campaign:statusChanged` socket handler.
   * Patches rather than invalidates: the event already carries the only changed field. */
  applyStatusChange = (campaignId: string, status: CampaignStatusType) => {
    this.queryClient.setQueryData<Campaign[]>([...this.baseKey, "list"], (old = []) =>
      old.map((c) => (c._id === campaignId ? { ...c, status } : c))
    )
    this.queryClient.setQueryData<Campaign>([...this.baseKey, `detail-${campaignId}`], (old) =>
      old ? { ...old, status } : old
    )
  }

  /** Builds (and by default emails) a report for an arbitrary period, instead of waiting for the monthly cron. */
  useGenerateReport = (options?: {
    onSuccess?: (data: CampaignReport) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<
      CampaignReport,
      { campaignId: string; payload?: { periodStart?: string; sendEmail?: boolean } }
    >(({ campaignId, payload }) => this.api.generateReport(campaignId, payload), {
      ...options,
      onSuccess: (data) => {
        this.invalidate(`reports-${data.campaignId}`)
        options?.onSuccess?.(data)
      },
    })

  useUpdateStatus = (options?: {
    onSuccess?: (data: Campaign) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<Campaign, { campaignId: string; status: CampaignStatusType }>(
      ({ campaignId, status }) => this.api.updateStatus(campaignId, status),
      {
        ...options,
        onSuccess: (updated) => {
          this.queryClient.setQueryData<Campaign[]>([...this.baseKey, "list"], (old = []) =>
            old.map((c) => (c._id === updated._id ? updated : c))
          )
          this.queryClient.setQueryData<Campaign>([...this.baseKey, `detail-${updated._id}`], updated)
          options?.onSuccess?.(updated)
        },
      }
    )
}

export const campaignsQuery = new CampaignsQuery() as CampaignsQuery
