import { apiGet, apiPost, ApiRequestError } from "./typedClient"
import axiosInstance from "./index"
import type { components } from "@/types/apiSchema"

const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

/** GET /image-gallery documents a union response: the paginated list, or (only when a `url`
 * query param is sent) a single raw image doc instead — see imageGallery.response.js's own
 * comment. This wrapper never sends `url`, so it's always the list shape. */
type ImageGalleryListResponse = components["schemas"]["ImageGalleryListResponse"]

/** Get all images with pagination and filtering. */
export const getImages = async (params: Record<string, unknown> = {}) => {
  try {
    const { page = 1, limit = 20, tags, minScore } = params
    const result = await apiGet("/api/v1/image-gallery", {
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
}

/** Get single image by ID. */
export const getImageById = async (id: string) => {
  try {
    return await apiGet("/api/v1/image-gallery/{id}", { params: { id } })
  } catch (err) {
    return rethrow(err, "Failed to fetch image")
  }
}

/** Search images by query. */
export const searchImages = async (params: Record<string, unknown> = {}) => {
  try {
    const { q, page = 1, limit = 20, minScore } = params
    return await apiGet("/api/v1/image-gallery/search", {
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
}

/**
 * Generate a new image.
 * @param data - { prompt, style, imageSize, aspectRatio }
 */
export const generateImage = async (data: unknown) => {
  try {
    return await apiPost("/api/v1/user/images/generate", data as never)
  } catch (err) {
    return rethrow(err, "Failed to generate image")
  }
}

/**
 * Enhance an existing image. Multipart upload — not expressible as an OpenAPI JSON
 * requestBody, so this stays on plain axios rather than the typed client.
 * @param formData - FormData containing image (optional), prompt, etc.
 */
export const enhanceImage = async (formData: FormData) => {
  // Content-Type header is usually auto-set by browser for FormData,
  // but explicitly setting it to undefined lets the browser set the boundary correctly.
  const response = await axiosInstance.post(`/user/images/enhance`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

/**
 * Generate Alt Text for an image.
 * @param data - { imageUrl, context }
 */
export const generateAltText = async (data: unknown) => {
  try {
    return await apiPost("/api/v1/user/images/alt-text", data as never)
  } catch (err) {
    return rethrow(err, "Failed to generate alt text")
  }
}

/**
 * Upload a local image. Multipart — stays on plain axios, see enhanceImage above.
 * @param formData - { image: File }
 * @param overwriteUrl - Optional URL to overwrite on re-upload (same URL, file replaced)
 */
export const uploadImage = async (formData: FormData, overwriteUrl: string | null = null) => {
  if (overwriteUrl) {
    formData.append("overwriteUrl", overwriteUrl)
  }
  const response = await axiosInstance.post(`/user/images/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}
