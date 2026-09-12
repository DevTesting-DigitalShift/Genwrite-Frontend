// src/api/Campaign/Campaign.api.ts
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@api/typedClient"
import type { Campaign, CampaignActionLogEntry, CampaignReport } from "@/types/campaign"

export const CampaignAPI = {
  list: async () => {
    return (await apiGet("/api/v1/campaigns")) as Campaign[]
  },

  get: async (id: string) => {
    return (await apiGet("/api/v1/campaigns/{id}", { params: { id } })) as Campaign
  },

  create: async (payload: unknown) => {
    return (await apiPost("/api/v1/campaigns", payload as never)) as Campaign
  },

  update: async (id: string, payload: unknown) => {
    return (await apiPut("/api/v1/campaigns/{id}", payload as never, {
      params: { id },
    })) as Campaign
  },

  delete: async (id: string) => {
    await apiDelete("/api/v1/campaigns/{id}", { params: { id } })
  },

  listReports: async (campaignId: string) => {
    return (await apiGet("/api/v1/campaigns/{id}/reports", {
      params: { id: campaignId },
    })) as CampaignReport[]
  },

  getReport: async (campaignId: string, reportId: string) => {
    return (await apiGet("/api/v1/campaigns/{id}/reports/{reportId}", {
      params: { id: campaignId, reportId },
    })) as CampaignReport
  },

  getReportBreakdown: async (campaignId: string, reportId: string) => {
    return await apiGet("/api/v1/campaigns/{id}/reports/{reportId}/breakdown", {
      params: { id: campaignId, reportId },
    })
  },

  /** Queues analysis (202) — it does not wait for it. Listen for the `campaign:analyzed`
   * socket event for the actual results. */
  analyze: async (campaignId: string) => {
    return await apiPost("/api/v1/campaigns/{id}/analyze", undefined, {
      params: { id: campaignId },
    })
  },

  generateReport: async (
    campaignId: string,
    payload: { periodStart?: string; sendEmail?: boolean } = {}
  ) => {
    return (await apiPost("/api/v1/campaigns/{id}/reports/generate", payload as never, {
      params: { id: campaignId },
    })) as CampaignReport
  },

  getMetrics: async (campaignId: string, params: { from?: string; to?: string } = {}) => {
    return await apiGet("/api/v1/campaigns/{id}/metrics", {
      params: { id: campaignId },
      query: params as never,
    })
  },

  getSuggestions: async (campaignId: string) => {
    return await apiGet("/api/v1/campaigns/{id}/suggestions", { params: { id: campaignId } })
  },

  getActions: async (campaignId: string) => {
    return (await apiGet("/api/v1/campaigns/{id}/actions", {
      params: { id: campaignId },
    })) as CampaignActionLogEntry[]
  },

  updateStatus: async (campaignId: string, status: string) => {
    return (await apiPatch("/api/v1/campaigns/{id}/status", { status } as never, {
      params: { id: campaignId },
    })) as Campaign
  },
}
