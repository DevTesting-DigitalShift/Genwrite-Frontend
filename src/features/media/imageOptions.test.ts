import { describe, expect, it } from "vitest"
import {
  aspectLabel,
  cheapestImageCredits,
  imageCredits,
  imageKey,
  resolveImageChoice,
  usdToCredits,
} from "./imageOptions"

// What the pricing catalogue serves for two models: one with a quality setting, one without.
const gpt = {
  id: "openai/gpt-image-2",
  imageOptions: {
    aspectRatios: ["1:1", "16:9"],
    resolutions: ["1k"],
    qualities: ["low", "medium", "high"],
    defaults: { aspectRatio: "1:1", resolution: "1k", quality: "medium" },
    usd: {
      "1:1|1k|low": 0.006,
      "1:1|1k|medium": 0.053,
      "1:1|1k|high": 0.211,
      "16:9|1k|low": 0.006,
      "16:9|1k|medium": 0.053,
      "16:9|1k|high": 0.211,
    },
  },
} as never
const hidream = {
  id: "fal-ai/hidream-o1-image",
  imageOptions: {
    aspectRatios: ["1:1", "16:9"],
    resolutions: ["1k", "2k"],
    qualities: null,
    defaults: { aspectRatio: "1:1", resolution: "1k", quality: null },
    usd: { "1:1|1k|": 0.0105, "1:1|2k|": 0.042, "16:9|1k|": 0.0059, "16:9|2k|": 0.0236 },
  },
} as never

describe("resolveImageChoice", () => {
  const options = (gpt as { imageOptions: never }).imageOptions

  it("fills in the model's defaults for anything not picked", () => {
    expect(resolveImageChoice(options)).toEqual({
      aspectRatio: "1:1",
      resolution: "1k",
      quality: "medium",
    })
  })

  it("keeps a valid pick", () => {
    expect(resolveImageChoice(options, { aspectRatio: "16:9", quality: "high" })).toEqual({
      aspectRatio: "16:9",
      resolution: "1k",
      quality: "high",
    })
  })

  it("falls back to the default for a pick the model doesn't offer (e.g. after switching models)", () => {
    expect(
      resolveImageChoice(options, { aspectRatio: "21:9", resolution: "2k", quality: "ultra" })
    ).toEqual({ aspectRatio: "1:1", resolution: "1k", quality: "medium" })
  })

  it("never carries a quality onto a model that has none", () => {
    const noQuality = (hidream as { imageOptions: never }).imageOptions
    expect(resolveImageChoice(noQuality, { quality: "high" }).quality).toBeNull()
  })
})

describe("imageCredits", () => {
  it("prices the picked combination from the backend table", () => {
    expect(imageCredits(gpt, { quality: "high" })).toBe(22) // $0.211
    expect(imageCredits(gpt)).toBe(6) // medium by default: $0.053
    expect(imageCredits(hidream, { resolution: "2k" })).toBe(5) // $0.042
  })

  it("is null for a model with no options, or no model — never a guess", () => {
    expect(imageCredits(undefined)).toBeNull()
    expect(imageCredits({ id: "x" } as never)).toBeNull()
  })

  it("is null if a combination isn't in the table", () => {
    const broken = {
      id: "x",
      imageOptions: { ...(gpt as { imageOptions: object }).imageOptions, usd: {} },
    } as never
    expect(imageCredits(broken)).toBeNull()
  })
})

describe("helpers", () => {
  it("builds the same key the backend does", () => {
    expect(imageKey({ aspectRatio: "16:9", resolution: "2k", quality: null })).toBe("16:9|2k|")
    expect(imageKey({ aspectRatio: "1:1", resolution: "1k", quality: "low" })).toBe("1:1|1k|low")
  })

  it("rounds credits up, ignoring float noise", () => {
    expect(usdToCredits(0.84)).toBe(84)
    expect(usdToCredits(0.168 * 5)).toBe(84) // 0.8400000000000001 must not become 85
    expect(usdToCredits(0.0059)).toBe(1)
  })

  it("finds the cheapest combination for 'from N credits'", () => {
    expect(cheapestImageCredits(gpt)).toBe(1)
    expect(cheapestImageCredits(hidream)).toBe(1)
    expect(cheapestImageCredits({ id: "x" } as never)).toBeNull()
  })

  it("labels aspect ratios in plain words", () => {
    expect(aspectLabel("16:9")).toBe("Widescreen 16:9")
    expect(aspectLabel("match")).toBe("Match input")
    expect(aspectLabel("5:4")).toBe("5:4")
  })
})
