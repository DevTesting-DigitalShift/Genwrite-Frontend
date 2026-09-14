// src/api/ImageGallery/ImageGallery.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { ImageGalleryAPI } from "./ImageGallery.api"

/** No delete/update-by-id endpoints exist (see useImageStore.ts, the pre-existing read-only
 * reference this mirrors) — hand-written hooks against QueryBase rather than BaseCRUDQuery. */
class ImageGalleryQuery extends QueryBase<unknown> {
  baseKey = ["imageGallery"]
  api = ImageGalleryAPI

  useList = (
    params: Record<string, unknown> = {},
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof ImageGalleryAPI.list>>, Error>
  ) => this.useParamQuery("list", (p) => this.api.list(p), params, options)

  useDetail = (
    id: string,
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof ImageGalleryAPI.get>>, Error>
  ) => this.useFetchQuery(`detail-${id}`, () => this.api.get(id), { enabled: !!id, ...options })

  useSearch = (
    params: Record<string, unknown> = {},
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof ImageGalleryAPI.search>>, Error>
  ) =>
    this.useParamQuery("search", (p) => this.api.search(p), params, {
      enabled: !!params?.q,
      ...options,
    })

  useGenerate = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof ImageGalleryAPI.generate>>, unknown>(
      (data) => this.api.generate(data),
      {
        ...options,
        onSuccess: () => {
          this.invalidate("list")
          options?.onSuccess?.()
        },
      }
    )

  useEnhance = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof ImageGalleryAPI.enhance>>, FormData>(
      (formData) => this.api.enhance(formData),
      options
    )

  useGenerateAltText = () =>
    this.useMutate<Awaited<ReturnType<typeof ImageGalleryAPI.generateAltText>>, unknown>((data) =>
      this.api.generateAltText(data)
    )

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
