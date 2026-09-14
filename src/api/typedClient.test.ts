import { describe, expect, it, vi } from "vitest"

// axiosInstance is mocked so these tests never touch the network — only the
// path-building, response-unwrapping, and error-normalization logic in typedClient.ts
// itself is under test here (the per-domain .api.ts files have their own contract tests).
const axiosMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
vi.mock("@api/index", () => ({ default: axiosMock }))

const { apiGet, apiPost, apiDelete, ApiRequestError, rethrow } = await import("@api/typedClient")

describe("typedClient path building", () => {
  it("substitutes {param} segments from options.params", async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { _id: "abc" }, status: 200, config: {} })
    await apiGet("/brand/{id}", { params: { id: "abc" } })
    expect(axiosMock.get).toHaveBeenCalledWith("/brand/abc", expect.anything())
  })

  it("URL-encodes param values", async () => {
    axiosMock.get.mockResolvedValueOnce({ data: {}, status: 200, config: {} })
    await apiGet("/brand/{id}", { params: { id: "a/b c" } })
    expect(axiosMock.get).toHaveBeenCalledWith("/brand/a%2Fb%20c", expect.anything())
  })

  it("leaves the path untouched when there are no params", async () => {
    axiosMock.get.mockResolvedValueOnce({ data: [], status: 200, config: {} })
    await apiGet("/brand")
    expect(axiosMock.get).toHaveBeenCalledWith("/brand", expect.anything())
  })

  it("passes query as axios's params config, not the URL", async () => {
    axiosMock.get.mockResolvedValueOnce({ data: {}, status: 200, config: {} })
    await apiGet("/brand/site-info", { query: { url: "example.com" } as never })
    expect(axiosMock.get).toHaveBeenCalledWith(
      "/brand/site-info",
      expect.objectContaining({ params: { url: "example.com" } })
    )
  })
})

describe("typedClient response unwrapping", () => {
  it("resolves with response.data directly, not the full AxiosResponse", async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { _id: "1", name: "x" }, status: 201, config: {} })
    const result = await apiPost("/brand/addBrand", { name: "x" } as never)
    expect(result).toEqual({ _id: "1", name: "x" })
  })
})

describe("typedClient error normalization", () => {
  it("wraps a failed request in ApiRequestError carrying the backend's message/code/status", async () => {
    axiosMock.delete.mockRejectedValueOnce({
      response: { status: 404, data: { message: "Brand not found", code: "NOT_FOUND" } },
      message: "Request failed with status code 404",
    })

    await expect(apiDelete("/brand/{id}", { params: { id: "x" } })).rejects.toMatchObject({
      message: "Brand not found",
      code: "NOT_FOUND",
      status: 404,
    })
  })

  it("leaves status undefined for a network-level failure with no response", async () => {
    axiosMock.get.mockRejectedValueOnce({ message: "Network Error" })
    await expect(apiGet("/brand")).rejects.toMatchObject({ status: undefined })
  })
})

describe("rethrow", () => {
  it("keeps the backend's message when the error is an ApiRequestError", () => {
    const err = new ApiRequestError({ message: "Sitemap unreachable" }, 400, "fallback")
    expect(() => rethrow(err, "fallback")).toThrow("Sitemap unreachable")
  })

  it("falls back to the given message when ApiRequestError carries none", () => {
    // Empty constructor fallback so `.message` ends up falsy, exercising rethrow's own
    // fallback branch rather than the one baked in at construction time.
    const err = new ApiRequestError({}, 500, "")
    expect(() => rethrow(err, "Failed to do the thing")).toThrow("Failed to do the thing")
  })

  it("normalizes a non-ApiRequestError, non-Error throw into a plain Error", () => {
    expect(() => rethrow("some string", "fallback message")).toThrow("fallback message")
  })

  it("preserves a genuine Error's own message over the fallback", () => {
    expect(() => rethrow(new Error("real cause"), "fallback")).toThrow("real cause")
  })
})
