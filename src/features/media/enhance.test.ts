import { describe, expect, it } from "vitest"
import { enhanceOptions } from "./enhance"

const catalogue = {
  "topaz/upscale/video/precision": {
    kind: "video",
    unit: "second",
    usdPerUnit: 0.02,
    label: "Topaz Upscale",
    resolutionPricing: { "1080p": 0.02, "4k": 0.06 },
  },
} as never

describe("enhanceOptions", () => {
  it("offers 1080p and 4K for a 720p video, priced per second", () => {
    expect(enhanceOptions({ resolution: "720p", durationSeconds: 10 }, catalogue)).toEqual([
      { resolution: "1080p", credits: 20, factor: 1.5 },
      { resolution: "4k", credits: 60, factor: 3 },
    ])
  })

  it("drops 4K for 480p (4.5× is past the upscaler's 4× limit)", () => {
    expect(enhanceOptions({ resolution: "480p", durationSeconds: 5 }, catalogue)).toEqual([
      { resolution: "1080p", credits: 10, factor: 2.25 },
    ])
  })

  it("offers only 4K once a video is 1080p, and nothing when it's already enhanced", () => {
    const hd = { resolution: "1080p", durationSeconds: 5 }
    expect(enhanceOptions(hd, catalogue).map((o) => o.resolution)).toEqual(["4k"])
    expect(enhanceOptions(hd, catalogue, ["4k"])).toEqual([])
  })

  it("offers nothing for videos without a recorded resolution or length", () => {
    expect(enhanceOptions({}, catalogue)).toEqual([])
    expect(enhanceOptions({ resolution: "720p" }, catalogue)).toEqual([])
    expect(enhanceOptions(null, catalogue)).toEqual([])
  })
})
