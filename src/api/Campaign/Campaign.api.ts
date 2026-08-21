// src/api/Campaign/Campaign.api.ts
import axiosInstance from "@/api"
import type {
  Campaign,
  CampaignReport,
  CampaignStatusType,
  CampaignAnalyzeResult,
  CampaignLiveMetrics,
  CampaignLiveSuggestion,
  CampaignActionLogEntry,
} from "@/types/campaign"

export const CampaignAPI = {
  list: async (): Promise<Campaign[]> => {
    const res = await axiosInstance.get("/campaigns")
    return res.data
  },

  get: async (id: string): Promise<Campaign> => {
    const res = await axiosInstance.get(`/campaigns/${id}`)
    return res.data
  },

  create: async (payload: Partial<Campaign>): Promise<Campaign> => {
    const res = await axiosInstance.post("/campaigns", payload)
    return res.data
  },

  update: async (id: string, payload: Partial<Campaign>): Promise<Campaign> => {
    const res = await axiosInstance.put(`/campaigns/${id}`, payload)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/campaigns/${id}`)
  },

  listReports: async (campaignId: string): Promise<CampaignReport[]> => {
    const res = await axiosInstance.get(`/campaigns/${campaignId}/reports`)
    return res.data
  },

  getReport: async (campaignId: string, reportId: string): Promise<CampaignReport> => {
    const res = await axiosInstance.get(`/campaigns/${campaignId}/reports/${reportId}`)
    return res.data
  },

  analyze: async (campaignId: string): Promise<CampaignAnalyzeResult> => {
    const res = await axiosInstance.post(`/campaigns/${campaignId}/analyze`)
    return res.data
  },

  generateReport: async (
    campaignId: string,
    payload: { periodStart?: string; sendEmail?: boolean } = {}
  ): Promise<CampaignReport> => {
    const res = await axiosInstance.post(`/campaigns/${campaignId}/reports/generate`, payload)
    return res.data
  },

  getMetrics: async (
    campaignId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<CampaignLiveMetrics> => {
    const res = await axiosInstance.get(`/campaigns/${campaignId}/metrics`, { params })
    return res.data
  },

  getSuggestions: async (campaignId: string): Promise<CampaignLiveSuggestion[]> => {
    const res = await axiosInstance.get(`/campaigns/${campaignId}/suggestions`)
    return res.data
  },

  getActions: async (campaignId: string): Promise<CampaignActionLogEntry[]> => {
    const res = await axiosInstance.get(`/campaigns/${campaignId}/actions`)
    return res.data
  },

  updateStatus: async (campaignId: string, status: CampaignStatusType): Promise<Campaign> => {
    const res = await axiosInstance.patch(`/campaigns/${campaignId}/status`, { status })
    return res.data
  },
}
