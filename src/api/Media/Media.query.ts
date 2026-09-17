// src/api/Media/Media.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import {
  MediaAPI,
  type GenerateImagePayload,
  type GenerateVideoPayload,
  type MediaAsset,
  type MediaAssetList,
  type MediaListParams,
} from "./Media.api"

/** No update/delete-by-id endpoints exist for media assets — hand-written hooks against
 * QueryBase rather than BaseCRUDQuery, same shape as Job/ImageGallery. */
class MediaQuery extends QueryBase<MediaAsset> {
  baseKey = ["media"]
  api = MediaAPI

  useList = (params?: MediaListParams, options?: AnyUseQueryOptions<MediaAssetList>) =>
    this.useParamQuery<MediaAssetList, MediaListParams | undefined>(
      "list",
      (p) => this.api.list(p),
      params,
      options
    )

  useDetail = (id: string, options?: AnyUseQueryOptions<MediaAsset>) =>
    this.useFetchQuery<MediaAsset>(`detail-${id}`, () => this.api.get(id), {
      enabled: !!id,
      ...options,
    })

  useGenerateImage = (options?: {
    onSuccess?: (data: MediaAsset) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<MediaAsset, GenerateImagePayload>((payload) => this.api.generateImage(payload), {
      ...options,
      onSuccess: (data) => {
        this.prependToList(data)
        options?.onSuccess?.(data)
      },
    })

  useGenerateVideo = (options?: {
    onSuccess?: (data: MediaAsset) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<MediaAsset, GenerateVideoPayload>((payload) => this.api.generateVideo(payload), {
      ...options,
      onSuccess: (data) => {
        this.prependToList(data)
        options?.onSuccess?.(data)
      },
    })

  useRefresh = (options?: { onSuccess?: (data: MediaAsset) => void }) =>
    this.useMutate<MediaAsset, string>((id) => this.api.refresh(id), {
      ...options,
      onSuccess: (data) => {
        this.applyAssetUpdate(data)
        options?.onSuccess?.(data)
      },
    })

  /** Adds a freshly-submitted (queued) asset to the cache. Routed through applyAssetUpdate
   * rather than a blind prepend: the backend emits "media:created" over the socket before
   * the HTTP response resolves, so by the time the mutation's onSuccess runs the asset is
   * usually already in the list — prepending again is what produced duplicate cards. */
  private prependToList = (asset: MediaAsset) => this.applyAssetUpdate(asset)

  /** Patches every cached list page's matching entry plus the detail cache in place — used
   * both by useRefresh's onSuccess above and by the "media:created"/"media:statusChanged"
   * socket handler (see useMediaSocketSync in Media.tsx) for live status updates without a
   * refetch, matching this codebase's established cache-patch-over-invalidate pattern. */
  applyAssetUpdate = (asset: MediaAsset) => {
    this.queryClient.setQueriesData<MediaAssetList>(
      { queryKey: [...this.baseKey, "list"] },
      (old) => {
        if (!old) return old
        const exists = old.data.some((a) => a._id === asset._id)
        return {
          ...old,
          data: exists
            ? old.data.map((a) => (a._id === asset._id ? asset : a))
            : [asset, ...old.data],
        }
      }
    )
    this.queryClient.setQueryData<MediaAsset>([...this.baseKey, `detail-${asset._id}`], asset)
  }
}

export const mediaQuery = new MediaQuery() as MediaQuery
