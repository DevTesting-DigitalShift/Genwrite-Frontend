import { describe, expect, it } from "vitest"
import { estimatePipelineCredits } from "./pipelinePricing"

// Same figures as the backend's mediaPipeline.integration.test.js, so a drift between the
// two formulas fails here too. The catalogue is what GET /user/pricing serves: the frontend
// has no prices of its own, so every model a quote needs must be in it.
const base = {
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
  // A model billed per video, whatever its length.
  "example/per-video": { kind: "video", unit: "video", usdPerUnit: 0.4, label: "Per video" },
}
const frame = {
  "bytedance/seedream/v5/pro/edit": {
    kind: "image",
    unit: "image",
    usdPerUnit: 0.0675,
    label: "Seedream Edit",
  },
}
const subtitles = {
  "fal-ai/elevenlabs/forced-alignment": {
    kind: "video",
    unit: "video",
    usdPerUnit: 0.22,
    label: "Alignment",
  },
  "veed/subtitles": { kind: "video", unit: "video", usdPerUnit: 0.1, label: "VEED" },
}
const catalogue = { ...base, ...frame, ...subtitles } as never

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

  it("adds the small per-screenshot fee for reference runs (backend: 121 credits for 3 screenshots on Kling O3)", () => {
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
      ...base,
      "bytedance/seedream/v5/pro/edit": {
        ...frame["bytedance/seedream/v5/pro/edit"],
        usdPerUnit: 0.135,
      },
      "fal-ai/elevenlabs/forced-alignment": {
        ...subtitles["fal-ai/elevenlabs/forced-alignment"],
        usdPerUnit: 0.44,
      },
      "veed/subtitles": subtitles["veed/subtitles"],
    } as never
    const quote = (c: never, withSubtitles: boolean) =>
      estimatePipelineCredits(c, {
        videoModel: "alibaba/wan-3.0/image-to-video",
        durationSeconds: 5,
        resolution: "720p",
        subtitles: withSubtitles,
      }) as number
    expect(quote(catalogue, false)).toBe(89) // 2 × $0.0675 + 5s × $0.10 × 1.5
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
      estimatePipelineCredits(catalogue, { videoModel: "example/per-video", durationSeconds: 5 })
    ).toBe(74)
  })

  describe("never guesses a price the catalogue doesn't have", () => {
    it("is null for an unknown model", () => {
      expect(
        estimatePipelineCredits(catalogue, { videoModel: "nope", durationSeconds: 5 })
      ).toBeNull()
    })

    it("is null when the frame model's price is missing, unless the run reuses frames", () => {
      const noFrame = base as never
      const run = { videoModel: "alibaba/wan-3.0/image-to-video", durationSeconds: 5 }
      expect(estimatePipelineCredits(noFrame, run)).toBeNull()
      expect(estimatePipelineCredits(noFrame, { ...run, includeFrames: false })).toBe(75)
    })

    it("is null when subtitles are asked for but their prices are missing", () => {
      const noSubtitles = { ...base, ...frame } as never
      const run = { videoModel: "alibaba/wan-3.0/image-to-video", durationSeconds: 5 }
      expect(estimatePipelineCredits(noSubtitles, { ...run, subtitles: true })).toBeNull()
      expect(estimatePipelineCredits(noSubtitles, run)).toBe(89)
    })

    it("is null for an empty catalogue (nothing loaded yet)", () => {
      expect(
        estimatePipelineCredits({} as never, {
          videoModel: "alibaba/wan-3.0/image-to-video",
          durationSeconds: 5,
        })
      ).toBeNull()
    })
  })
})
