import { describe, expect, it } from "vitest"
import { estimatePipelineCredits } from "./pipelinePricing"

// Same figures as the backend's mediaPipeline.integration.test.js, so a drift between the
// two formulas fails here too.
const catalogue = {
  "alibaba/wan-3.0/image-to-video": {
    kind: "video",
    unit: "second",
    usdPerUnit: 0.1,
    resolutionPricing: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
    label: "Wan 3.0",
    frameVideo: { endFrame: "optional" },
  },
  "fal-ai/kling-video/v3/pro/image-to-video": {
    kind: "video",
    unit: "second",
    usdPerUnit: 0.168,
    label: "Kling 3 Pro",
    frameVideo: { endFrame: "optional" },
  },
  "fal-ai/kling-video/o3/pro/reference-to-video": {
    kind: "video",
    unit: "second",
    usdPerUnit: 0.14,
    label: "Kling O3 Pro (product refs)",
    frameVideo: { endFrame: "optional" },
  },
  "blackforestlabs/flux-3/first-last-frame-to-video": {
    kind: "video",
    unit: "second",
    usdPerUnit: 0.29,
    label: "FLUX 3 (Start + End Frames)",
    legacy: true,
    frameVideo: { endFrame: "required" },
  },
  "fal-ai/wan-flf2v": { kind: "video", unit: "video", usdPerUnit: 0.4, label: "Wan" },
} as never

describe("estimatePipelineCredits", () => {
  it("prices opening-frame candidates + 1.5× a per-second video at the picked resolution", () => {
    const quote = (resolution?: "480p" | "720p" | "1080p") =>
      estimatePipelineCredits(catalogue, {
        videoModel: "alibaba/wan-3.0/image-to-video",
        durationSeconds: 5,
        resolution,
      })
    expect(quote("1080p")).toBe(164)
    expect(quote("720p")).toBe(89)
    expect(quote("480p")).toBe(51)
    expect(quote()).toBe(89) // no resolution → the model's default (720p) rate
  })

  it("adds the small per-screenshot fee for a UGC ad (backend: 121 credits for 3 screenshots on Kling O3)", () => {
    const withScreens = (productImages: number) =>
      estimatePipelineCredits(catalogue, {
        videoModel: "fal-ai/kling-video/o3/pro/reference-to-video",
        durationSeconds: 5,
        productImages,
      })
    expect(withScreens(0)).toBe(withScreens(1)) // the first screenshot is free
    expect(withScreens(3)).toBe(121)
  })

  it("follows fal's live prices: a repriced frame model and subtitle models change the quote", () => {
    const live = {
      ...(catalogue as Record<string, unknown>),
      "bytedance/seedream/v5/pro/edit": {
        kind: "image",
        unit: "image",
        usdPerUnit: 0.135,
        label: "Seedream Edit",
      },
      "fal-ai/elevenlabs/forced-alignment": {
        kind: "video",
        unit: "video",
        usdPerUnit: 0.44,
        label: "Alignment",
      },
      "veed/subtitles": { kind: "video", unit: "video", usdPerUnit: 0.1, label: "VEED" },
    } as never
    const quote = (c: never, subtitles: boolean) =>
      estimatePipelineCredits(c, {
        videoModel: "alibaba/wan-3.0/image-to-video",
        durationSeconds: 5,
        resolution: "720p",
        subtitles,
      })
    expect(quote(catalogue, false)).toBe(89) // 2 × $0.0675 (fallback) + 5s × $0.10 × 1.5
    expect(quote(live, false)).toBe(102) // frames doubled: 2 × $0.135
    expect(quote(live, true) - quote(live, false)).toBe(54) // $0.54 add-on instead of $0.32
  })

  it("adds the flat subtitle add-on", () => {
    expect(
      estimatePipelineCredits(catalogue, {
        videoModel: "alibaba/wan-3.0/image-to-video",
        durationSeconds: 5,
        resolution: "1080p",
        subtitles: true,
      })
    ).toBe(196)
  })

  it("adds closing-frame candidates when the end frame is locked, without float rounding up", () => {
    expect(
      estimatePipelineCredits(catalogue, {
        videoModel: "fal-ai/kling-video/v3/pro/image-to-video",
        durationSeconds: 5,
        useEndFrame: true,
      })
    ).toBe(153)
  })

  it("always prices an end frame for a model that requires one", () => {
    expect(
      estimatePipelineCredits(catalogue, {
        videoModel: "blackforestlabs/flux-3/first-last-frame-to-video",
        durationSeconds: 5,
      })
    ).toBe(245)
  })

  it("prices a video-only regenerate without frames", () => {
    expect(
      estimatePipelineCredits(catalogue, {
        videoModel: "alibaba/wan-3.0/image-to-video",
        durationSeconds: 5,
        resolution: "1080p",
        includeFrames: false,
      })
    ).toBe(150)
  })

  it("ignores duration for per-video models", () => {
    expect(
      estimatePipelineCredits(catalogue, { videoModel: "fal-ai/wan-flf2v", durationSeconds: 5 })
    ).toBe(74)
  })

  it("returns 0 for an unknown model", () => {
    expect(estimatePipelineCredits(catalogue, { videoModel: "nope", durationSeconds: 5 })).toBe(0)
  })
})
