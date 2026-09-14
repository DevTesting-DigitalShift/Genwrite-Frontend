import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { queryClient, QueryProvider } from "@utils/queryClient"

// BrandAPI itself is mocked — these tests are about brandsQuery's cache behavior, not
// BrandAPI's contract (covered by Brand.api.test.ts). The point of this file: mutations
// must patch the cache directly via setQueryData, never invalidateQueries + refetch —
// see the "no refetch" assertions below.
//
// Uses the real singleton queryClient from @utils/queryClient — QueryBase.ts's
// `this.queryClient` is that same import, not whatever client a test-local
// QueryClientProvider would supply, so assertions have to read off this one.
const list = vi.fn()
const get = vi.fn()
const create = vi.fn()
const update = vi.fn()
const del = vi.fn()
vi.mock("./Brand.api", () => ({
  BrandAPI: { list, get, create, update, delete: del, getSiteInfo: vi.fn() },
}))

describe("brandsQuery cache patching", () => {
  beforeEach(() => {
    queryClient.clear()
    list.mockReset()
    get.mockReset()
    create.mockReset()
    update.mockReset()
    del.mockReset()
  })

  it("useCreate appends the new item to the list cache without refetching", async () => {
    const { brandsQuery } = await import("./Brand.query")
    queryClient.setQueryData(["brand", "list"], [{ _id: "1", nameOfVoice: "A" }])
    create.mockResolvedValueOnce({ _id: "2", nameOfVoice: "B" })

    const { result } = renderHook(() => brandsQuery.useCreate(), { wrapper: QueryProvider })
    result.current.mutate({ nameOfVoice: "B" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // list() must never have been called — a refetch would call it, a cache patch never does.
    expect(list).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(["brand", "list"])).toEqual([
      { _id: "1", nameOfVoice: "A" },
      { _id: "2", nameOfVoice: "B" },
    ])
  })

  it("useUpdate patches both the list entry and the detail cache in place", async () => {
    const { brandsQuery } = await import("./Brand.query")
    queryClient.setQueryData(
      ["brand", "list"],
      [
        { _id: "1", nameOfVoice: "A" },
        { _id: "2", nameOfVoice: "B" },
      ]
    )
    queryClient.setQueryData(["brand", "detail-1"], { _id: "1", nameOfVoice: "A" })
    update.mockResolvedValueOnce({ _id: "1", nameOfVoice: "A-updated" })

    const { result } = renderHook(() => brandsQuery.useUpdate(), { wrapper: QueryProvider })
    result.current.mutate({ id: "1", data: { nameOfVoice: "A-updated" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).not.toHaveBeenCalled()
    expect(get).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(["brand", "list"])).toEqual([
      { _id: "1", nameOfVoice: "A-updated" },
      { _id: "2", nameOfVoice: "B" },
    ])
    expect(queryClient.getQueryData(["brand", "detail-1"])).toEqual({
      _id: "1",
      nameOfVoice: "A-updated",
    })
  })

  it("useDelete removes the item from the list cache and evicts its detail cache", async () => {
    const { brandsQuery } = await import("./Brand.query")
    queryClient.setQueryData(
      ["brand", "list"],
      [
        { _id: "1", nameOfVoice: "A" },
        { _id: "2", nameOfVoice: "B" },
      ]
    )
    queryClient.setQueryData(["brand", "detail-1"], { _id: "1", nameOfVoice: "A" })
    del.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => brandsQuery.useDelete(), { wrapper: QueryProvider })
    result.current.mutate("1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(["brand", "list"])).toEqual([{ _id: "2", nameOfVoice: "B" }])
    expect(queryClient.getQueryData(["brand", "detail-1"])).toBeUndefined()
  })
})
