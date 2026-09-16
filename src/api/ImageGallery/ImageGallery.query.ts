// src/api/ImageGallery/ImageGallery.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { ImageGalleryAPI } from "./ImageGallery.api"
import type { ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

/** GET /image-gallery's real OpenAPI type is a union with the single-item shape (only
 * reachable by passing a `url` query param, which this wrapper never does) — .list()'s own
 * return type is already narrowed to the list envelope, so the hook options use that
 * narrower type instead of the raw union `ApiResponse<"/image-gallery", "get">`. */
type ImageGalleryListResponse = Awaited<ReturnType<typeof ImageGalleryAPI.list>>
type ImageGallerySearchResponse = Awaited<ReturnType<typeof ImageGalleryAPI.search>>

/** No delete/update-by-id endpoints exist (see useImageStore.ts, the pre-existing read-only
 * reference this mirrors) — hand-written hooks against QueryBase rather than BaseCRUDQuery. */
class ImageGalleryQuery extends QueryBase<unknown> {
  baseKey = ["imageGallery"]
  api = ImageGalleryAPI

  useList = (
    params: Record<string, unknown> = {},
    options?: AnyUseQueryOptions<ImageGalleryListResponse>
  ) => this.useParamQuery<ImageGalleryListResponse>("list", (p) => this.api.list(p), params, options)

  useDetail = (
    id: string,
    options?: AnyUseQueryOptions<ApiResponse<"/image-gallery/{id}", "get">>
  ) => this.useFetchQuery(`detail-${id}`, () => this.api.get(id), { enabled: !!id, ...options })

  useSearch = (
    params: Record<string, unknown> = {},
    options?: AnyUseQueryOptions<ImageGallerySearchResponse>
  ) =>
    this.useParamQuery<ImageGallerySearchResponse>("search", (p) => this.api.search(p), params, {
      enabled: !!params?.q,
      ...options,
    })

  useGenerate = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/user/images/generate", "post">,
      ApiRequestBody<"/user/images/generate", "post">
    >((data) => this.api.generate(data), {
      ...options,
      onSuccess: () => {
        this.invalidate("list")
        options?.onSuccess?.()
      },
    })

  useEnhance = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof ImageGalleryAPI.enhance>>, FormData>(
      (formData) => this.api.enhance(formData),
      {
        ...options,
        onSuccess: () => {
          this.invalidate("list")
          options?.onSuccess?.()
        },
      }
    )

  useGenerateAltText = () =>
    this.useMutate<
      ApiResponse<"/user/images/alt-text", "post">,
      ApiRequestBody<"/user/images/alt-text", "post">
    >((data) => this.api.generateAltText(data))

  useUpload = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      Awaited<ReturnType<typeof ImageGalleryAPI.upload>>,
      { formData: FormData; overwriteUrl?: string | null }
    >(({ formData, overwriteUrl }) => this.api.upload(formData, overwriteUrl ?? null), {
      ...options,
      onSuccess: () => {
        this.invalidate("list")
        options?.onSuccess?.()
      },
    })

  /** Plain (non-hook) passthroughs for manual/imperative pagination (e.g. an infinite-scroll
   * picker accumulating pages into its own local state) — not a fit for useQuery's
   * declarative, single-page-per-key model. */
  list = (params: Record<string, unknown> = {}) => this.api.list(params)
  search = (params: Record<string, unknown> = {}) => this.api.search(params)
}

export const imageGalleryQuery = new ImageGalleryQuery() as ImageGalleryQuery
