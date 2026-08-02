import type { BlogAnalyticsQuery, BlogAnalyticsResponse } from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function getBlogAnalytics(query?: BlogAnalyticsQuery): Promise<BlogAnalyticsResponse> {
  const response = await adminAxiosInstance.get<BlogAnalyticsResponse>("/admin/blogs/analytics", {
    params: query,
  })
  return response.data
}
