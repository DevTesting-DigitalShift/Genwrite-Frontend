// src/api/Integration/Integration.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { IntegrationAPI } from "./Integration.api"

/** No single-entity get/update/delete-by-id endpoints exist for integrations (see
 * useIntegrationStore.ts, the pre-existing read-only reference this mirrors) — hand-written
 * hooks against QueryBase, matching Integration.api.ts's method set. */
class IntegrationQuery extends QueryBase<unknown> {
  baseKey = ["integrations"]
  api = IntegrationAPI

  useList = (
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof IntegrationAPI.list>>, Error>
  ) => this.useFetchQuery("list", () => this.api.list(), options)

  useCategories = (
    type: string,
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof IntegrationAPI.getCategories>>, Error>
  ) =>
    this.useFetchQuery(`categories-${type}`, () => this.api.getCategories(type), {
      enabled: !!type,
      ...options,
    })

  usePing = (
    type: string,
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof IntegrationAPI.ping>>, Error>
  ) =>
    this.useFetchQuery(`ping-${type}`, () => this.api.ping(type), { enabled: !!type, ...options })

  useCreate = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof IntegrationAPI.create>>, unknown>(
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
    this.useMutate<Awaited<ReturnType<typeof IntegrationAPI.createPost>>, unknown>((payload) =>
      this.api.createPost(payload)
    )

  useUpdate = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof IntegrationAPI.update>>, unknown>(
      (payload) => this.api.update(payload),
      {
        ...options,
        onSuccess: () => {
          this.invalidate("list")
          options?.onSuccess?.()
        },
      }
    )

  useConnect = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof IntegrationAPI.connect>>, unknown>(
      (payload) => this.api.connect(payload),
      {
        ...options,
        onSuccess: () => {
          this.invalidate("list")
          options?.onSuccess?.()
        },
      }
    )
}

export const integrationQuery = new IntegrationQuery() as IntegrationQuery
