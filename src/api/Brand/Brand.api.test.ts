import { describe, expect, it, vi } from "vitest"

// Mocked at the typedClient boundary — these tests assert BrandAPI calls the right
// method/path/params/body for each operation, and handles the response shape correctly
// (e.g. list()'s array-wrapping fallback). typedClient.test.ts covers the layer beneath.
const apiGet = vi.fn()
const apiPost = vi.fn()
const apiPut = vi.fn()
const apiDelete = vi.fn()
vi.mock("@api/typedClient", async () => {
  const actual = await vi.importActual<typeof import("@api/typedClient")>("@api/typedClient")
  return { ...actual, apiGet, apiPost, apiPut, apiDelete }
})

const { BrandAPI } = await import("./Brand.api")

describe("BrandAPI.list", () => {
  it("returns the array as-is when the backend responds with an array", async () => {
    apiGet.mockResolvedValueOnce([{ _id: "1" }, { _id: "2" }])
    const result = await BrandAPI.list()
    expect(apiGet).toHaveBeenCalledWith("/brand")
    expect(result).toEqual([{ _id: "1" }, { _id: "2" }])
  })

  it("wraps a single object response in an array", async () => {
    apiGet.mockResolvedValueOnce({ _id: "1" })
    const result = await BrandAPI.list()
    expect(result).toEqual([{ _id: "1" }])
  })

  it("returns an empty array for a null/empty response", async () => {
    apiGet.mockResolvedValueOnce(null)
    const result = await BrandAPI.list()
    expect(result).toEqual([])
  })

  it("rethrows with a fallback message on failure", async () => {
    apiGet.mockRejectedValueOnce(new Error("network down"))
    await expect(BrandAPI.list()).rejects.toThrow("network down")
  })
})

describe("BrandAPI.get", () => {
  it("calls GET /brand/{id} with the id substituted", async () => {
    apiGet.mockResolvedValueOnce({ _id: "abc" })
    await BrandAPI.get("abc")
    expect(apiGet).toHaveBeenCalledWith("/brand/{id}", { params: { id: "abc" } })
  })
})

describe("BrandAPI.create", () => {
  it("posts the payload to /brand/addBrand", async () => {
    apiPost.mockResolvedValueOnce({ _id: "new" })
    const payload = { nameOfVoice: "Friendly" }
    await BrandAPI.create(payload)
    expect(apiPost).toHaveBeenCalledWith("/brand/addBrand", payload)
  })
})

describe("BrandAPI.update", () => {
  it("puts the payload to /brand/{id}", async () => {
    apiPut.mockResolvedValueOnce({ _id: "abc" })
    await BrandAPI.update("abc", { nameOfVoice: "Formal" })
    expect(apiPut).toHaveBeenCalledWith(
      "/brand/{id}",
      { nameOfVoice: "Formal" },
      { params: { id: "abc" } }
    )
  })
})

describe("BrandAPI.delete", () => {
  it("deletes /brand/{id} and resolves with no value", async () => {
    apiDelete.mockResolvedValueOnce(undefined)
    await expect(BrandAPI.delete("abc")).resolves.toBeUndefined()
    expect(apiDelete).toHaveBeenCalledWith("/brand/{id}", { params: { id: "abc" } })
  })

  it("rethrows on failure instead of swallowing it", async () => {
    apiDelete.mockRejectedValueOnce(new Error("forbidden"))
    await expect(BrandAPI.delete("abc")).rejects.toThrow("forbidden")
  })
})

describe("BrandAPI.getSiteInfo", () => {
  it("passes url as a query param, not a path param", async () => {
    apiGet.mockResolvedValueOnce({ describeBrand: "..." })
    await BrandAPI.getSiteInfo("https://example.com")
    expect(apiGet).toHaveBeenCalledWith("/brand/site-info", {
      query: { url: "https://example.com" },
    })
  })
})
