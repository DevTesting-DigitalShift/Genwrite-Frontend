// src/api/Media/MediaPipeline.api.ts
import { apiGet, apiPost, rethrow } from "@api/typedClient"
import type { ApiQueryParams, ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

export type MediaPipeline = ApiResponse<"/media/pipelines/{id}", "get">
export type MediaPipelineList = ApiResponse<"/media/pipelines", "get">
export type CreateMediaPipelinePayload = ApiRequestBody<"/media/pipelines", "post">
export type RegenerateMediaPipelinePayload = ApiRequestBody<
  "/media/pipelines/{id}/regenerate",
  "post"
>
export type MediaPipelineListParams = ApiQueryParams<"/media/pipelines", "get">

/** Auto Video: prompt → QA'd first/last frames → QA'd video, run server-side (see
 * src/modules/media/pipeline/ on the backend). Progress arrives over the
 * "mediaPipeline:updated" socket event — see useMediaNotifications. */
export const MediaPipelineAPI = {
  create: async (payload: CreateMediaPipelinePayload): Promise<MediaPipeline> => {
    try {
      return await apiPost("/media/pipelines", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to start video generation")
    }
  },

  get: async (id: string): Promise<MediaPipeline> => {
    try {
      return await apiGet("/media/pipelines/{id}", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to fetch video run")
    }
  },

  list: async (params?: MediaPipelineListParams): Promise<MediaPipelineList> => {
    try {
      return await apiGet("/media/pipelines", { query: params as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch video runs")
    }
  },

  regenerate: async (
    id: string,
    payload: RegenerateMediaPipelinePayload
  ): Promise<MediaPipeline> => {
    try {
      return await apiPost("/media/pipelines/{id}/regenerate", payload as never, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to regenerate video")
    }
  },
}
