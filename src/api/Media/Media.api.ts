// src/api/Media/Media.api.ts
import { apiGet, apiPost, rethrow } from "@api/typedClient"
import type { ApiQueryParams, ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

export type MediaAsset = ApiResponse<"/media/{id}", "get">
export type MediaAssetList = ApiResponse<"/media", "get">
export type GenerateImagePayload = ApiRequestBody<"/media/image/generate", "post">
export type GenerateVideoPayload = ApiRequestBody<"/media/video/generate", "post">
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
