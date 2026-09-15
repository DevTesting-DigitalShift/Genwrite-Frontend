// src/api/Integration/Integration.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { IntegrationAPI } from "./Integration.api"
import type { ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

/** No single-entity get/update/delete-by-id endpoints exist for integrations (see
 * useIntegrationStore.ts, the pre-existing read-only reference this mirrors) — hand-written
 * hooks against QueryBase, matching Integration.api.ts's method set. */
class IntegrationQuery extends QueryBase<unknown> {
  baseKey = ["integrations"]
  api = IntegrationAPI

  useList = (options?: AnyUseQueryOptions<ApiResponse<"/integrations", "get">>) =>
    this.useFetchQuery("list", () => this.api.list(), options)

  useCategories = (
    type: string,
    options?: AnyUseQueryOptions<ApiResponse<"/integrations/category", "get">>
  ) =>
    this.useFetchQuery(`categories-${type}`, () => this.api.getCategories(type), {
      enabled: !!type,
      ...options,
    })

  usePing = (
    type: string,
    options?: AnyUseQueryOptions<ApiResponse<"/integrations/ping", "get">>
  ) =>
    this.useFetchQuery(`ping-${type}`, () => this.api.ping(type), { enabled: !!type, ...options })

  /** Plain (non-hook) passthrough for call sites that ping an arbitrary, dynamically-chosen
   * type imperatively (e.g. inside a plugin-status check callback) rather than as a
   * component-level query keyed to one static type. */
  ping = (type: string) => this.api.ping(type)

  useCreate = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/integrations", "post">, ApiRequestBody<"/integrations", "post">>(
      (payload) => this.api.create(payload),
      {
        ...options,
        onSuccess: () => {
          this.invalidate("list")
          options?.onSuccess?.()
        },
      }
    )

  useCreatePost = () =>
    this.useMutate<
      ApiResponse<"/integrations/post", "post">,
      ApiRequestBody<"/integrations/post", "post">
    >((payload) => this.api.createPost(payload))

  useUpdate = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/integrations/post", "put">,
      ApiRequestBody<"/integrations/post", "put">
    >((payload) => this.api.update(payload), {
      ...options,
      onSuccess: () => {
        this.invalidate("list")
        options?.onSuccess?.()
      },
    })

  useConnect = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/integrations/connect", "post">,
      ApiRequestBody<"/integrations/connect", "post">
    >((payload) => this.api.connect(payload), {
      ...options,
      onSuccess: () => {
        this.invalidate("list")
        options?.onSuccess?.()
      },
    })
}

export const integrationQuery = new IntegrationQuery() as IntegrationQuery
