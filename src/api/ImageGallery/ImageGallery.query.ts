// src/api/ImageGallery/ImageGallery.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { ImageGalleryAPI } from "./ImageGallery.api"
import type { ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

/** No delete/update-by-id endpoints exist (see useImageStore.ts, the pre-existing read-only
 * reference this mirrors) — hand-written hooks against QueryBase rather than BaseCRUDQuery. */
class ImageGalleryQuery extends QueryBase<unknown> {
  baseKey = ["imageGallery"]
  api = ImageGalleryAPI

  useList = (
    params: Record<string, unknown> = {},
    options?: AnyUseQueryOptions<ApiResponse<"/image-gallery", "get">>
  ) => this.useParamQuery("list", (p) => this.api.list(p), params, options)

  useDetail = (
    id: string,
    options?: AnyUseQueryOptions<ApiResponse<"/image-gallery/{id}", "get">>
  ) => this.useFetchQuery(`detail-${id}`, () => this.api.get(id), { enabled: !!id, ...options })

  useSearch = (
    params: Record<string, unknown> = {},
    options?: AnyUseQueryOptions<ApiResponse<"/image-gallery/search", "get">>
  ) =>
    this.useParamQuery("search", (p) => this.api.search(p), params, {
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
      options
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
}

export const imageGalleryQuery = new ImageGalleryQuery() as ImageGalleryQuery
