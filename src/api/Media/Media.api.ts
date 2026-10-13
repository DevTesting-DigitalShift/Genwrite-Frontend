// src/api/Media/Media.api.ts
import { apiGet, apiPost, rethrow } from "@api/typedClient"
import type { ApiQueryParams, ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

export type MediaAsset = ApiResponse<"/media/{id}", "get">
export type MediaAssetList = ApiResponse<"/media", "get">
export type GenerateImagePayload = ApiRequestBody<"/media/image/generate", "post">
export type GenerateVideoPayload = ApiRequestBody<"/media/video/generate", "post">
export type EnhanceVideoPayload = ApiRequestBody<"/media/{id}/enhance", "post">
export type RefinePromptPayload = {
  prompt: string
  kind: "image" | "video"
  purpose?: string
}
export type MediaListParams = ApiQueryParams<"/media", "get">

export const MediaAPI = {
  generateImage: async (payload: GenerateImagePayload): Promise<MediaAsset> => {
    try {
      return await apiPost("/media/image/generate", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to start image generation")
    }
  },

  generateVideo: async (payload: GenerateVideoPayload): Promise<MediaAsset> => {
    try {
      return await apiPost("/media/video/generate", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to start video generation")
    }
  },

  /** Free: rewrites a rough idea into a fuller prompt so the user can review it before paying. */
  refinePrompt: async (payload: RefinePromptPayload): Promise<{ prompt: string }> => {
    try {
      return await apiPost("/media/prompt/refine" as never, payload as never)
    } catch (err) {
      return rethrow(err, "Failed to refine the prompt")
    }
  },

  get: async (id: string): Promise<MediaAsset> => {
    try {
      return await apiGet("/media/{id}", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to fetch media asset")
    }
  },

  list: async (params?: MediaListParams): Promise<MediaAssetList> => {
    try {
      return await apiGet("/media", { query: params as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch media assets")
    }
  },

  /** Upscales a finished video to a higher resolution — returns a NEW (queued) video asset and
   * leaves the original in the library. */
  enhance: async (id: string, payload: EnhanceVideoPayload): Promise<MediaAsset> => {
    try {
      return await apiPost("/media/{id}/enhance", payload as never, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to enhance video")
    }
  },

  /** Manually polls fal for the current job status — the only way this app learns about
   * progress today outside of the "media:created"/"media:statusChanged" socket events
   * (see media.service.js on the backend), since fal's webhook only fires in deployed
   * environments with a public API_DOMAIN, not local dev. */
  refresh: async (id: string): Promise<MediaAsset> => {
    try {
      return await apiPost("/media/{id}/refresh", undefined, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to refresh media asset status")
    }
  },
}
