import type { JobAnalyticsQuery, JobAnalyticsResponse } from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function getJobAnalytics(query?: JobAnalyticsQuery): Promise<JobAnalyticsResponse> {
  const response = await adminAxiosInstance.get<JobAnalyticsResponse>("/admin/jobs/analytics", {
    params: query,
  })
  return response.data
}
