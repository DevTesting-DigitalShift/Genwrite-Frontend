// src/api/Campaign/Campaign.query.ts
import type { AnyUseQueryOptions } from "@api/QueryBase"
import { BaseCRUDQuery } from "@api/BaseCRUDQuery"
import { CampaignAPI } from "./Campaign.api"
import type {
  Campaign,
  CampaignReport,
  CampaignStatusType,
  CampaignAnalyzeResult,
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

  /** Runs AI analysis for every campaign blog now, instead of waiting for the weekly job. */
  useAnalyze = (options?: {
    onSuccess?: (data: CampaignAnalyzeResult, campaignId: string) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<CampaignAnalyzeResult, string>((campaignId) => this.api.analyze(campaignId), {
      ...options,
      onSuccess: (data, campaignId) => {
        this.invalidate(`suggestions-${campaignId}`)
        options?.onSuccess?.(data, campaignId)
      },
    })

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
