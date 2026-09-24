import { describe, expect, it } from "vitest"
import { estimatePipelineCredits } from "./pipelinePricing"

// Same figures as the backend's mediaPipeline.integration.test.js, so a drift between the
// two formulas fails here too.
const catalogue = {
  "fal-ai/hidream-o1-image": {
    kind: "image",
    unit: "megapixel",
    usdPerUnit: 0.01,
    label: "HiDream",
  },
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video": {
    kind: "video",
    unit: "second",
    usdPerUnit: 0.07,
    label: "Kling",
  },
  "fal-ai/wan-flf2v": { kind: "video", unit: "video", usdPerUnit: 0.4, label: "Wan" },
} as never

describe("estimatePipelineCredits", () => {
  it("prices frames + 1.5× a per-second video", () => {
    expect(
      estimatePipelineCredits(catalogue, {
        videoModel: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
        durationSeconds: 5,
      })
    ).toBe(57)
  })

  it("prices a video-only regenerate without frames", () => {
    expect(
      estimatePipelineCredits(catalogue, {
        videoModel: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
        durationSeconds: 5,
        includeFrames: false,
      })
    ).toBe(53)
  })

  it("ignores duration for per-video models", () => {
    expect(
      estimatePipelineCredits(catalogue, { videoModel: "fal-ai/wan-flf2v", durationSeconds: 5 })
    ).toBe(65)
  })

  it("returns 0 for an unknown model", () => {
    expect(estimatePipelineCredits(catalogue, { videoModel: "nope", durationSeconds: 5 })).toBe(0)
  })
})
