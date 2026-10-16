import { describe, expect, it } from "vitest"
import type { MediaAsset } from "@api/Media/Media.api"
import { countByTab, filterAssets, sortAssets, timeAgo } from "./mediaLibrary"

const asset = (over: Partial<MediaAsset> & { _id: string }): MediaAsset =>
  ({
    type: "image",
    status: "completed",
    prompt: "a city skyline",
    purpose: "other",
    createdAt: "2026-10-10T10:00:00.000Z",
    ...over,
  }) as MediaAsset

const assets = [
  asset({
    _id: "1",
    prompt: "Woman holding a serum",
    purpose: "ugc_ad",
    createdAt: "2026-10-12T10:00:00.000Z",
  }),
  asset({
    _id: "2",
    type: "video",
    status: "processing",
    prompt: "Drone over mountains",
    purpose: "reel",
    createdAt: "2026-10-14T10:00:00.000Z",
  }),
  asset({
    _id: "3",
    type: "video",
    status: "queued",
    prompt: "Sneaker spin",
    createdAt: "2026-10-13T10:00:00.000Z",
  }),
  asset({
    _id: "4",
    status: "failed",
    prompt: "Broken one",
    createdAt: "2026-10-11T10:00:00.000Z",
  }),
]

describe("filterAssets", () => {
  it("returns everything on the All tab with no query", () => {
    expect(filterAssets(assets, "all", "").map((a) => a._id)).toEqual(["1", "2", "3", "4"])
  })

  it("splits by type", () => {
    expect(filterAssets(assets, "image", "").map((a) => a._id)).toEqual(["1", "4"])
    expect(filterAssets(assets, "video", "").map((a) => a._id)).toEqual(["2", "3"])
  })

  it("treats queued and processing as generating", () => {
    expect(filterAssets(assets, "generating", "").map((a) => a._id)).toEqual(["2", "3"])
  })

  it("lists only failed assets on the Failed tab", () => {
    expect(filterAssets(assets, "failed", "").map((a) => a._id)).toEqual(["4"])
  })

  it("matches the prompt case-insensitively and ignores surrounding spaces", () => {
    expect(filterAssets(assets, "all", "  DRONE ").map((a) => a._id)).toEqual(["2"])
  })

  it("matches the purpose label even when the prompt never says it", () => {
    expect(filterAssets(assets, "all", "ugc ad").map((a) => a._id)).toEqual(["1"])
  })

  it("combines the tab and the query", () => {
    expect(filterAssets(assets, "video", "sneaker").map((a) => a._id)).toEqual(["3"])
    expect(filterAssets(assets, "image", "sneaker")).toEqual([])
  })
})

describe("sortAssets", () => {
  it("puts the newest first by default and does not mutate the input", () => {
    const input = [...assets]
    expect(sortAssets(input, "newest").map((a) => a._id)).toEqual(["2", "3", "1", "4"])
    expect(input.map((a) => a._id)).toEqual(["1", "2", "3", "4"])
  })

  it("can put the oldest first", () => {
    expect(sortAssets(assets, "oldest").map((a) => a._id)).toEqual(["4", "1", "3", "2"])
  })
})

describe("countByTab", () => {
  it("counts each tab from the same list", () => {
    expect(countByTab(assets)).toEqual({ all: 4, image: 2, video: 2, generating: 2, failed: 1 })
  })
})

describe("timeAgo", () => {
  const now = new Date("2026-10-15T12:00:00.000Z").getTime()

  it("reads naturally at each scale", () => {
    expect(timeAgo("2026-10-15T11:59:40.000Z", now)).toBe("just now")
    expect(timeAgo("2026-10-15T11:55:00.000Z", now)).toBe("5m ago")
    expect(timeAgo("2026-10-15T09:00:00.000Z", now)).toBe("3h ago")
    expect(timeAgo("2026-10-12T12:00:00.000Z", now)).toBe("3d ago")
  })

  it("falls back to a date after a week, and to nothing when there is no timestamp", () => {
    expect(timeAgo("2026-09-01T12:00:00.000Z", now)).toMatch(/Sep/)
    expect(timeAgo(undefined, now)).toBe("")
  })
})
