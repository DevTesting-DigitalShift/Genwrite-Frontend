import { describe, expect, it, vi } from "vitest"

const apiGet = vi.fn()
const apiPost = vi.fn()
vi.mock("@api/typedClient", async () => {
  const actual = await vi.importActual<typeof import("@api/typedClient")>("@api/typedClient")
  return { ...actual, apiGet, apiPost }
})

const { MediaAPI } = await import("./Media.api")

describe("MediaAPI.generateImage", () => {
  it("posts to /media/image/generate with the payload as-is", async () => {
    const payload = { prompt: "a cat", model: "fal-ai/nano-banana", purpose: "poster" as const }
    apiPost.mockResolvedValueOnce({ _id: "1", status: "queued" })
    await MediaAPI.generateImage(payload as never)
    expect(apiPost).toHaveBeenCalledWith("/media/image/generate", payload)
  })

  it("rethrows on failure", async () => {
    apiPost.mockRejectedValueOnce(new Error("insufficient credits"))
    await expect(MediaAPI.generateImage({} as never)).rejects.toThrow("insufficient credits")
  })
})

describe("MediaAPI.generateVideo", () => {
  it("posts to /media/video/generate with the payload as-is", async () => {
    const payload = { prompt: "a dog running", model: "fal-ai/wan-2.5", purpose: "reel" as const }
    apiPost.mockResolvedValueOnce({ _id: "2", status: "queued" })
    await MediaAPI.generateVideo(payload as never)
    expect(apiPost).toHaveBeenCalledWith("/media/video/generate", payload)
  })
})

describe("MediaAPI.get", () => {
  it("calls GET /media/{id} with the id substituted", async () => {
    apiGet.mockResolvedValueOnce({ _id: "abc" })
    await MediaAPI.get("abc")
    expect(apiGet).toHaveBeenCalledWith("/media/{id}", { params: { id: "abc" } })
  })
})

describe("MediaAPI.list", () => {
  it("calls GET /media with query params", async () => {
    apiGet.mockResolvedValueOnce({ data: [], pagination: {} })
    await MediaAPI.list({ page: 1, limit: 20 } as never)
    expect(apiGet).toHaveBeenCalledWith("/media", { query: { page: 1, limit: 20 } })
  })
})

describe("MediaAPI.refresh", () => {
  it("posts to /media/{id}/refresh with no body", async () => {
    apiPost.mockResolvedValueOnce({ _id: "abc", status: "processing" })
    await MediaAPI.refresh("abc")
    expect(apiPost).toHaveBeenCalledWith("/media/{id}/refresh", undefined, {
      params: { id: "abc" },
    })
  })
})
