import { describe, expect, it } from "vitest"
import type { MediaAsset } from "@api/Media/Media.api"
import { retryVideoPayload } from "./RetryVideoAction"

const failedVideo = (over: Partial<MediaAsset> = {}) =>
  ({
    _id: "a1",
    type: "video",
    status: "failed",
    prompt: "a drone shot",
    providerModel: "creatify/boreal",
    metadata: { durationSeconds: 8, resolution: "720p", aspectRatio: "9:16" },
    ...over,
  }) as MediaAsset

describe("retryVideoPayload", () => {
  it("rebuilds the original text-to-video request", () => {
    expect(retryVideoPayload(failedVideo())).toEqual({
      prompt: "a drone shot",
      model: "creatify/boreal",
      durationSeconds: 8,
      resolution: "720p",
      aspectRatio: "9:16",
    })
  })

  it("offers no retry for non-failed, image, pipeline or enhanced assets", () => {
    expect(retryVideoPayload(failedVideo({ status: "completed" }))).toBeNull()
    expect(retryVideoPayload(failedVideo({ type: "image" }))).toBeNull()
    expect(retryVideoPayload(failedVideo({ pipelineId: "p1" }))).toBeNull()
    expect(retryVideoPayload(failedVideo({ metadata: { enhancedFrom: "x" } }))).toBeNull()
  })
})
