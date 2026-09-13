// src/api/User/User.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { UserAPI } from "./User.api"
import { apiErrorMessage } from "@/types/api"
import { toast } from "sonner"

class UserQuery extends QueryBase<unknown> {
  baseKey = ["user"]
  api = UserAPI

  useProfile = (options?: AnyUseQueryOptions<Awaited<ReturnType<typeof UserAPI.getProfile>>>) =>
    this.useFetchQuery("profile", () => this.api.getProfile(), options)

  useTransactions = (
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof UserAPI.getTransactions>>>
  ) => this.useFetchQuery("transactions", () => this.api.getTransactions(), options)

  useUpdateProfile = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof UserAPI.updateProfile>>, unknown>(
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
    this.useMutate<Awaited<ReturnType<typeof UserAPI.markNotificationsAsRead>>, void>(
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
}

export const userQuery = new UserQuery() as UserQuery
