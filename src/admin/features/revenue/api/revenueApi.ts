import type { RevenueAnalyticsQuery, RevenueAnalyticsResponse } from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function getRevenueAnalytics(
  query?: RevenueAnalyticsQuery
): Promise<RevenueAnalyticsResponse> {
  const response = await adminAxiosInstance.get<RevenueAnalyticsResponse>(
    "/admin/revenue/analytics",
    { params: query }
  )
  return response.data
}
