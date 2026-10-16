import { beforeEach, describe, expect, it, vi } from "vitest"

const STORAGE_KEY = "pricing-catalogue"
const DAY = 24 * 60 * 60 * 1000

const liveCatalogue = {
  media: {
    "fal-ai/hidream-o1-image": {
      mode: "text_to_image",
      kind: "image",
      unit: "megapixel",
      usdPerUnit: 0.01,
      label: "HiDream",
    },
  },
  blog: { wordCount: { base: 100, cost: 10 } },
}
const cachedCatalogue = {
  media: {
    "fal-ai/hidream-o1-image": {
      mode: "text_to_image",
      kind: "image",
      unit: "megapixel",
      usdPerUnit: 0.02,
      label: "HiDream (cached)",
    },
  },
  blog: { wordCount: { base: 100, cost: 10 } },
}

const getCatalogue = vi.fn()

/** A fresh store per test: the module holds its in-flight request and rehydrates from localStorage on import. */
async function freshStore() {
  vi.resetModules()
  vi.doMock("@api/Pricing/Pricing.api", () => ({ PricingAPI: { getCatalogue } }))
  return (await import("./usePricingStore")).default
}

const seedCache = (ageMs: number) =>
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      state: { catalogue: cachedCatalogue, fetchedAt: Date.now() - ageMs },
      version: 1,
    })
  )

beforeEach(() => {
  localStorage.clear()
  getCatalogue.mockReset()
  vi.spyOn(console, "warn").mockImplementation(() => {})
})

describe("usePricingStore", () => {
  it("has no fal models and isn't ready before anything has loaded", async () => {
    const store = await freshStore()
    expect(store.getState().status).toBe("loading")
    expect(store.getState().isLive).toBe(false)
    expect(Object.keys(store.getState().catalogue.media)).toEqual([])
  })

  it("becomes ready with the live catalogue and caches it for the next visit", async () => {
    getCatalogue.mockResolvedValue(liveCatalogue)
    const store = await freshStore()
    await store.getState().load()

    expect(store.getState().status).toBe("ready")
    expect(store.getState().isLive).toBe(true)
    expect(store.getState().catalogue.media).toEqual(liveCatalogue.media)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    expect(saved.state.catalogue.media).toEqual(liveCatalogue.media)
    expect(saved.state.fetchedAt).toBeGreaterThan(0)
    expect(saved.state).not.toHaveProperty("status") // only the data is cached, never the flags
  })

  it("reports an error — not made-up prices — when the first fetch fails, and retries on the next load()", async () => {
    getCatalogue.mockRejectedValueOnce(new Error("backend down"))
    const store = await freshStore()
    await store.getState().load()

    expect(store.getState().status).toBe("error")
    expect(Object.keys(store.getState().catalogue.media)).toEqual([])

    getCatalogue.mockResolvedValueOnce(liveCatalogue)
    await store.getState().load()
    expect(store.getState().status).toBe("ready")
    expect(getCatalogue).toHaveBeenCalledTimes(2)
  })

  it("shares one request between concurrent load() calls", async () => {
    getCatalogue.mockResolvedValue(liveCatalogue)
    const store = await freshStore()
    await Promise.all([store.getState().load(), store.getState().load()])
    expect(getCatalogue).toHaveBeenCalledTimes(1)
  })

  describe("with a cached catalogue", () => {
    it("is ready straight away with the cached prices, before the live fetch returns", async () => {
      seedCache(60 * 60 * 1000) // an hour old
      const store = await freshStore()
      expect(store.getState().status).toBe("ready")
      expect(store.getState().isLive).toBe(false)
      expect(store.getState().catalogue.media["fal-ai/hidream-o1-image"].label).toBe(
        "HiDream (cached)"
      )
    })

    it("keeps serving the cache when the live fetch fails", async () => {
      seedCache(60 * 60 * 1000)
      getCatalogue.mockRejectedValue(new Error("backend down"))
      const store = await freshStore()
      await store.getState().load()
      expect(store.getState().status).toBe("ready")
      expect(store.getState().catalogue.media["fal-ai/hidream-o1-image"].label).toBe(
        "HiDream (cached)"
      )
    })

    it("replaces the cache with the live catalogue once it arrives", async () => {
      seedCache(60 * 60 * 1000)
      getCatalogue.mockResolvedValue(liveCatalogue)
      const store = await freshStore()
      await store.getState().load()
      expect(store.getState().isLive).toBe(true)
      expect(store.getState().catalogue.media["fal-ai/hidream-o1-image"].label).toBe("HiDream")
    })

    it("ignores a cache older than a day", async () => {
      seedCache(DAY + 60 * 1000)
      const store = await freshStore()
      expect(store.getState().status).toBe("loading")
      expect(Object.keys(store.getState().catalogue.media)).toEqual([])
    })
  })
})
