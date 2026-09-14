// src/api/ImageGallery/ImageGallery.api.ts
import { apiGet, apiPost, rethrow } from "@api/typedClient"
import axiosInstance from "@api/index"
import type { components } from "@/types/apiSchema"

/** GET /image-gallery documents a union response: the paginated list, or (only when a `url`
 * query param is sent) a single raw image doc instead — see imageGallery.response.js's own
 * comment. This wrapper never sends `url`, so it's always the list shape. */
type ImageGalleryListResponse = components["schemas"]["ImageGalleryListResponse"]

export const ImageGalleryAPI = {
  /** Get all images with pagination and filtering. */
  list: async (params: Record<string, unknown> = {}): Promise<ImageGalleryListResponse> => {
    try {
      const { page = 1, limit = 20, tags, minScore } = params
      const result = await apiGet("/image-gallery", {
        query: {
          page,
          limit,
          ...(Array.isArray(tags) && tags.length > 0 ? { tags } : {}),
          ...(minScore !== undefined && minScore !== null ? { minScore } : {}),
        } as never,
      })
      return result as ImageGalleryListResponse
    } catch (err) {
      return rethrow(err, "Failed to fetch images")
    }
  },

  /** Get single image by ID. */
  get: async (id: string) => {
    try {
      return await apiGet("/image-gallery/{id}", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to fetch image")
    }
  },

  /** Search images by query. */
  search: async (params: Record<string, unknown> = {}) => {
    try {
      const { q, page = 1, limit = 20, minScore } = params
      return await apiGet("/image-gallery/search", {
        query: {
          ...(q ? { q } : {}),
          page,
          limit,
          ...(minScore !== undefined && minScore !== null ? { minScore } : {}),
        } as never,
      })
    } catch (err) {
      return rethrow(err, "Failed to search images")
    }
  },

  /**
   * Generate a new image.
   * @param data - { prompt, style, imageSize, aspectRatio }
   */
  generate: async (data: unknown) => {
    try {
      return await apiPost("/user/images/generate", data as never)
    } catch (err) {
      return rethrow(err, "Failed to generate image")
    }
  },

  /**
   * Enhance an existing image. Multipart upload — not expressible as an OpenAPI JSON
   * requestBody, so this stays on plain axios rather than the typed client.
   * @param formData - FormData containing image (optional), prompt, etc.
   */
  enhance: async (formData: FormData) => {
    // Content-Type header is usually auto-set by browser for FormData,
    // but explicitly setting it to undefined lets the browser set the boundary correctly.
    const response = await axiosInstance.post(`/user/images/enhance`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  /**
   * Generate Alt Text for an image.
   * @param data - { imageUrl, context }
   */
  generateAltText: async (data: unknown) => {
    try {
      return await apiPost("/user/images/alt-text", data as never)
    } catch (err) {
      return rethrow(err, "Failed to generate alt text")
    }
  },

  /**
   * Upload a local image. Multipart — stays on plain axios, see enhance above.
   * @param formData - { image: File }
   * @param overwriteUrl - Optional URL to overwrite on re-upload (same URL, file replaced)
   */
  upload: async (formData: FormData, overwriteUrl: string | null = null) => {
    if (overwriteUrl) {
      formData.append("overwriteUrl", overwriteUrl)
    }
    const response = await axiosInstance.post(`/user/images/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },
}
