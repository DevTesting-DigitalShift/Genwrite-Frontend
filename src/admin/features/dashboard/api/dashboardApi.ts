import type { AdminDetailedStatsResponse, AdminStatsResponse } from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const response = await adminAxiosInstance.get<AdminStatsResponse>("/admin/stats")
  return response.data
}

export async function getAdminDetailedStats(): Promise<AdminDetailedStatsResponse> {
  const response = await adminAxiosInstance.get<AdminDetailedStatsResponse>("/admin/stats/detailed")
  return response.data
}
