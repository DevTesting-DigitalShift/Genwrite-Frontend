import type { AdminTransactionListParams, AdminTransactionListResponse } from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function getAdminTransactions(
  params?: AdminTransactionListParams
): Promise<AdminTransactionListResponse> {
  const response = await adminAxiosInstance.get<AdminTransactionListResponse>(
    "/admin/transactions",
    { params: { page: params?.page || 1, limit: params?.limit || 10, userId: params?.userId } }
  )
  return response.data
}
