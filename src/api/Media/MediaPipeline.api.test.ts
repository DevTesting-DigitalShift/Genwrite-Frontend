import { describe, expect, it, vi } from "vitest"

const apiGet = vi.fn()
const apiPost = vi.fn()
vi.mock("@api/typedClient", async () => {
  const actual = await vi.importActual<typeof import("@api/typedClient")>("@api/typedClient")
  return { ...actual, apiGet, apiPost }
})

const { MediaPipelineAPI } = await import("./MediaPipeline.api")

describe("MediaPipelineAPI.create", () => {
  it("posts to /media/pipelines with the payload as-is", async () => {
    const payload = {
      prompt: "a barista pouring latte art",
      videoModel: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
      durationSeconds: 5,
      aspectRatio: "16:9",
      purpose: "reel",
    }
    apiPost.mockResolvedValueOnce({ _id: "p1", stage: "refining" })
    await MediaPipelineAPI.create(payload as never)
    expect(apiPost).toHaveBeenCalledWith("/media/pipelines", payload)
  })

  it("rethrows on failure", async () => {
    apiPost.mockRejectedValueOnce(new Error("insufficient credits"))
    await expect(MediaPipelineAPI.create({} as never)).rejects.toThrow("insufficient credits")
  })
})

describe("MediaPipelineAPI.get", () => {
  it("calls GET /media/pipelines/{id} with the id substituted", async () => {
    apiGet.mockResolvedValueOnce({ _id: "p1" })
    await MediaPipelineAPI.get("p1")
    expect(apiGet).toHaveBeenCalledWith("/media/pipelines/{id}", { params: { id: "p1" } })
  })
})

describe("MediaPipelineAPI.list", () => {
  it("calls GET /media/pipelines with query params", async () => {
    apiGet.mockResolvedValueOnce({ data: [], pagination: {} })
    await MediaPipelineAPI.list({ page: 1, limit: 10 } as never)
    expect(apiGet).toHaveBeenCalledWith("/media/pipelines", { query: { page: 1, limit: 10 } })
  })
})

describe("MediaPipelineAPI.regenerate", () => {
  it("posts the mode to /media/pipelines/{id}/regenerate", async () => {
    apiPost.mockResolvedValueOnce({ _id: "p2", stage: "video" })
    await MediaPipelineAPI.regenerate("p1", { mode: "video" })
    expect(apiPost).toHaveBeenCalledWith(
      "/media/pipelines/{id}/regenerate",
      { mode: "video" },
      { params: { id: "p1" } }
    )
  })
})
