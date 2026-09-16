// src/api/User/User.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { UserAPI } from "./User.api"
import type { ApiRequestBody, ApiResponse } from "@/types/apiHelpers"
import { apiErrorMessage } from "@/types/api"
import { toast } from "sonner"

class UserQuery extends QueryBase<unknown> {
  baseKey = ["user"]
  api = UserAPI

  useProfile = (options?: AnyUseQueryOptions<ApiResponse<"/user/profile", "get">["data"]>) =>
    this.useFetchQuery("profile", () => this.api.getProfile(), options)

  useTransactions = (options?: AnyUseQueryOptions<ApiResponse<"/user/transactions", "get">>) =>
    this.useFetchQuery("transactions", () => this.api.getTransactions(), options)

  useUpdateProfile = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/user/profile", "put">, ApiRequestBody<"/user/profile", "put">>(
      (payload) => this.api.updateProfile(payload),
      {
        onSuccess: () => {
          toast.success("Profile updated successfully")
          this.invalidate("profile")
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Failed to update profile"))
          options?.onError?.(error)
        },
      }
    )

  useMarkNotificationsRead = () =>
    this.useMutate<ApiResponse<"/user/notifications/read", "patch">, void>(
      () => this.api.markNotificationsAsRead(),
      {
        onSuccess: () => {
          this.invalidate("profile")
        },
        onError: (error) => {
          console.error("Failed to mark notifications as read", error)
        },
      }
    )

  // Plain passthroughs for Profile.tsx's imperative Promise.all mount fetch and
  // one-off form-submit handlers — not shaped as declarative query/mutation hooks.
  updatePassword = (payload: ApiRequestBody<"/user/update-password", "post">) =>
    this.api.updatePassword(payload)

  generateReferralCode = () => this.api.generateReferralCode()

  getReferralStats = () => this.api.getReferralStats()

  getEmailPreferences = () => this.api.getEmailPreferences()

  updateEmailPreferences = (payload: ApiRequestBody<"/user/email-preferences", "put">) =>
    this.api.updateEmailPreferences(payload)

  getSubscriptionStatus = () => this.api.getSubscriptionStatus()
}

export const userQuery = new UserQuery() as UserQuery
