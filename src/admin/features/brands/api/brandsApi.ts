import type { BrandAnalyticsQuery, BrandAnalyticsResponse } from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function getBrandAnalytics(
  query?: BrandAnalyticsQuery
): Promise<BrandAnalyticsResponse> {
  const response = await adminAxiosInstance.get<BrandAnalyticsResponse>("/admin/brands/analytics", {
    params: query,
  })
  return response.data
}
