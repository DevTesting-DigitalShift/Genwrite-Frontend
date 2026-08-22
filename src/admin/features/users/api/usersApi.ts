import type {
  AdminCreateUserInput,
  AdminManagedUser,
  AdminUpdateCreditsInput,
  AdminUpdateSubscriptionInput,
  AdminUserListParams,
  AdminUserListResponse,
  UpdateUserInput,
  UserAnalyticsResponse,
  UserBlogAnalyticsResponse,
  UserBlogsQuery,
  UserBlogsResponse,
  UserBrandAnalyticsResponse,
  UserDetailsResponse,
  UserJobAnalyticsResponse,
  UserTransactionAnalyticsResponse,
} from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function getAdminUsers(params?: AdminUserListParams): Promise<AdminUserListResponse> {
  const response = await adminAxiosInstance.get<AdminUserListResponse>("/admin/users", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 10,
      search: params?.search || undefined,
    },
  })
  return response.data
}

export async function createAdminUser(data: AdminCreateUserInput): Promise<AdminManagedUser> {
  const response = await adminAxiosInstance.post<AdminManagedUser>("/admin/users", data)
  return response.data
}

export async function getUserDetails(userId: string): Promise<UserDetailsResponse> {
  const response = await adminAxiosInstance.get<UserDetailsResponse>(`/admin/users/${userId}`)
  return response.data
}

export async function updateUser(userId: string, data: UpdateUserInput): Promise<AdminManagedUser> {
  const response = await adminAxiosInstance.put<AdminManagedUser>(`/admin/users/${userId}`, data)
  return response.data
}

export async function getUserAnalytics(userId: string): Promise<UserAnalyticsResponse> {
  const response = await adminAxiosInstance.get<UserAnalyticsResponse>(
    `/admin/users/${userId}/analytics`
  )
  return response.data
}

export async function getUserBlogs(
  userId: string,
  params?: UserBlogsQuery
): Promise<UserBlogsResponse> {
  const response = await adminAxiosInstance.get<UserBlogsResponse>(`/admin/users/${userId}/blogs`, {
    params,
  })
  return response.data
}

export async function getUserBlogAnalytics(userId: string): Promise<UserBlogAnalyticsResponse> {
  const response = await adminAxiosInstance.get<UserBlogAnalyticsResponse>(
    `/admin/users/${userId}/blogs/analytics`
  )
  return response.data
}

export async function getUserBrandAnalytics(userId: string): Promise<UserBrandAnalyticsResponse> {
  const response = await adminAxiosInstance.get<UserBrandAnalyticsResponse>(
    `/admin/users/${userId}/brands/analytics`
  )
  return response.data
}

export async function getUserJobAnalytics(userId: string): Promise<UserJobAnalyticsResponse> {
  const response = await adminAxiosInstance.get<UserJobAnalyticsResponse>(
    `/admin/users/${userId}/jobs/analytics`
  )
  return response.data
}

export async function getUserTransactionAnalytics(
  userId: string
): Promise<UserTransactionAnalyticsResponse> {
  const response = await adminAxiosInstance.get<UserTransactionAnalyticsResponse>(
    `/admin/users/${userId}/transactions/analytics`
  )
  return response.data
}

export async function updateAdminUserCredits(
  userId: string,
  data: AdminUpdateCreditsInput
): Promise<AdminManagedUser> {
  const response = await adminAxiosInstance.patch<AdminManagedUser>(
    `/admin/users/${userId}/credits`,
    data
  )
  return response.data
}

export async function updateAdminUserSubscription(
  userId: string,
  data: AdminUpdateSubscriptionInput
): Promise<AdminManagedUser> {
  const response = await adminAxiosInstance.patch<AdminManagedUser>(
    `/admin/users/${userId}/subscription`,
    data
  )
  return response.data
}
