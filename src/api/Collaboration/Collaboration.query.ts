// src/api/Collaboration/Collaboration.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { CollaborationAPI } from "./Collaboration.api"
import { toast } from "sonner"
import type { ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

/** No single-entity get/update endpoints exist, and invites/watching are two distinct
 * list caches rather than one CRUD entity — hand-written hooks against QueryBase. */
class CollaborationQuery extends QueryBase<unknown> {
  baseKey = ["collaboration"]
  api = CollaborationAPI

  useInvites = (options?: AnyUseQueryOptions<ApiResponse<"/collaboration/invites", "get">>) =>
    this.useFetchQuery("invites", () => this.api.listInvites(), options)

  useCreateInvite = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/collaboration/invites", "post">,
      ApiRequestBody<"/collaboration/invites", "post">
    >((payload) => this.api.createInvite(payload), {
      ...options,
      onSuccess: () => {
        toast.success("Invite sent!")
        this.invalidate("invites")
        options?.onSuccess?.()
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send invite")
        options?.onError?.(error)
      },
    })

  useRevokeInvite = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/collaboration/invites/{id}", "delete">, string>(
      (inviteId) => this.api.revokeInvite(inviteId),
      {
        ...options,
        onSuccess: () => {
          toast.success("Invite revoked")
          this.invalidate("invites")
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Failed to revoke invite")
          options?.onError?.(error)
        },
      }
    )

  useWorkspacesSharedWithMe = (
    options?: AnyUseQueryOptions<ApiResponse<"/collaboration/watching", "get">>
  ) => this.useFetchQuery("watching", () => this.api.listWorkspacesSharedWithMe(), options)

  useAcceptInvite = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/collaboration/invites/accept", "post">, string>(
      (token) => this.api.acceptInvite(token),
      {
        ...options,
        onSuccess: () => {
          this.invalidate("watching")
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Failed to accept invite")
          options?.onError?.(error)
        },
      }
    )
}

export const collaborationQuery = new CollaborationQuery() as CollaborationQuery
