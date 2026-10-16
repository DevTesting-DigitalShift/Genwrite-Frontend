import { describe, expect, it } from "vitest"
import { modelsForMode, resolveModelForMode } from "./mediaModes"

// What GET /user/pricing's media block looks like: each model carries its own mode.
const catalogue = {
  "pricey/video": {
    mode: "text_to_video",
    kind: "video",
    unit: "second",
    usdPerUnit: 0.4,
    label: "Pricey",
  },
  "cheap/video": {
    mode: "text_to_video",
    kind: "video",
    unit: "second",
    usdPerUnit: 0.1,
    resolutionPricing: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
    label: "Cheap",
  },
  "gone/video": {
    mode: "text_to_video",
    kind: "video",
    unit: "second",
    usdPerUnit: 0.01,
    label: "Gone",
    unavailable: true,
  },
  "an/image": {
    mode: "text_to_image",
    kind: "image",
    unit: "image",
    usdPerUnit: 0.05,
    label: "Image",
  },
  "internal/model": {
    mode: "internal",
    kind: "video",
    unit: "video",
    usdPerUnit: 0.1,
    label: "Internal",
  },
} as never

describe("modelsForMode", () => {
  it("lists a mode's models cheapest first, so the first is the default", () => {
    expect(modelsForMode(catalogue, "text_to_video").map((m) => m.id)).toEqual([
      "cheap/video",
      "pricey/video",
    ])
  })

  it("leaves out models fal no longer serves and other modes' models", () => {
    const ids = modelsForMode(catalogue, "text_to_video").map((m) => m.id)
    expect(ids).not.toContain("gone/video")
    expect(ids).not.toContain("an/image")
  })

  it("never offers an internal model in any picker", () => {
    for (const mode of [
      "text_to_image",
      "image_to_image",
      "text_to_video",
      "image_to_video",
      "reference_to_video",
    ] as const) {
      expect(modelsForMode(catalogue, mode).map((m) => m.id)).not.toContain("internal/model")
    }
  })

  it("is empty for a mode with no models, and for an empty catalogue", () => {
    expect(modelsForMode(catalogue, "reference_to_video")).toEqual([])
    expect(modelsForMode({} as never, "text_to_image")).toEqual([])
  })
})

describe("resolveModelForMode", () => {
  it("keeps the picked model while its mode still offers it", () => {
    expect(resolveModelForMode(catalogue, "text_to_video", "pricey/video")?.id).toBe("pricey/video")
  })

  it("falls back to the mode's cheapest when the picked model is gone or from another mode", () => {
    expect(resolveModelForMode(catalogue, "text_to_video", "gone/video")?.id).toBe("cheap/video")
    expect(resolveModelForMode(catalogue, "text_to_video", "an/image")?.id).toBe("cheap/video")
    expect(resolveModelForMode(catalogue, "text_to_video", undefined)?.id).toBe("cheap/video")
  })

  it("is undefined when the mode has nothing to offer", () => {
    expect(resolveModelForMode(catalogue, "image_to_image", "x")).toBeUndefined()
  })
})
