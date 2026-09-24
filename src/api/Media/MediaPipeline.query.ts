// src/api/Media/MediaPipeline.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import {
  MediaPipelineAPI,
  type CreateMediaPipelinePayload,
  type MediaPipeline,
  type MediaPipelineList,
  type MediaPipelineListParams,
  type RegenerateMediaPipelinePayload,
} from "./MediaPipeline.api"

/** Hand-written hooks against QueryBase, same shape as MediaQuery. Pipelines change stage
 * several times per run, so every update is patched into the cache (applyPipelineUpdate)
 * rather than invalidated — the socket delivers the whole document each time. */
class MediaPipelineQuery extends QueryBase<MediaPipeline> {
  baseKey = ["mediaPipeline"]
  api = MediaPipelineAPI

  useList = (params?: MediaPipelineListParams, options?: AnyUseQueryOptions<MediaPipelineList>) =>
    this.useParamQuery<MediaPipelineList, MediaPipelineListParams | undefined>(
      "list",
      (p) => this.api.list(p),
      params,
      options
    )

  useDetail = (id: string | null | undefined, options?: AnyUseQueryOptions<MediaPipeline>) =>
    this.useFetchQuery<MediaPipeline>(`detail-${id}`, () => this.api.get(id as string), {
      enabled: !!id,
      ...options,
    })

  useCreate = (options?: {
    onSuccess?: (data: MediaPipeline) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<MediaPipeline, CreateMediaPipelinePayload>(
      (payload) => this.api.create(payload),
      {
        ...options,
        onSuccess: (data) => {
          this.applyPipelineUpdate(data)
          options?.onSuccess?.(data)
        },
      }
    )

  useRegenerate = (options?: {
    onSuccess?: (data: MediaPipeline) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<MediaPipeline, { id: string } & RegenerateMediaPipelinePayload>(
      ({ id, ...payload }) => this.api.regenerate(id, payload),
      {
        ...options,
        onSuccess: (data) => {
          this.applyPipelineUpdate(data)
          options?.onSuccess?.(data)
        },
      }
    )

  /** Upserts a pipeline into every cached list page plus its detail cache. Runs from the
   * create/regenerate mutations and the "mediaPipeline:updated" socket event, which can
   * arrive in either order — hence upsert, never blind prepend. */
  applyPipelineUpdate = (pipeline: MediaPipeline) => {
    this.queryClient.setQueriesData<MediaPipelineList>(
      { queryKey: [...this.baseKey, "list"] },
      (old) => {
        if (!old) return old
        const exists = old.data.some((p) => p._id === pipeline._id)
        return {
          ...old,
          data: exists
            ? old.data.map((p) => (p._id === pipeline._id ? pipeline : p))
            : [pipeline, ...old.data],
        }
      }
    )
    this.queryClient.setQueryData<MediaPipeline>(
      [...this.baseKey, `detail-${pipeline._id}`],
      pipeline
    )
  }
}

export const mediaPipelineQuery = new MediaPipelineQuery() as MediaPipelineQuery
