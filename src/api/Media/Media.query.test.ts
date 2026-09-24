import { beforeEach, describe, expect, it } from "vitest"
import { queryClient } from "@utils/queryClient"
import { mediaQuery } from "./Media.query"
import { mediaPipelineQuery } from "./MediaPipeline.query"

const listKey = ["media", "list", { page: 1, limit: 40 }]
const pipelineListKey = ["mediaPipeline", "list", { page: 1, limit: 10 }]

beforeEach(() => queryClient.clear())

describe("mediaQuery.applyAssetUpdate", () => {
  it("keeps Auto Video intermediates (candidates, retried takes) out of the library", () => {
    queryClient.setQueryData(listKey, { data: [], pagination: {} })
    mediaQuery.applyAssetUpdate({ _id: "frame1", pipelineId: "p1", isIntermediate: true } as never)
    expect(queryClient.getQueryData<{ data: unknown[] }>(listKey)?.data).toEqual([])
  })

  it("adds the delivered pipeline video once it's no longer intermediate", () => {
    queryClient.setQueryData(listKey, { data: [], pagination: {} })
    mediaQuery.applyAssetUpdate({ _id: "video1", pipelineId: "p1", isIntermediate: false } as never)
    expect(
      queryClient.getQueryData<{ data: { _id: string }[] }>(listKey)?.data.map((a) => a._id)
    ).toEqual(["video1"])
  })
})

describe("mediaPipelineQuery.applyPipelineUpdate", () => {
  it("upserts into cached lists without duplicating", () => {
    queryClient.setQueryData(pipelineListKey, {
      data: [{ _id: "p1", stage: "refining" }],
      pagination: {},
    })

    mediaPipelineQuery.applyPipelineUpdate({ _id: "p1", stage: "video" } as never)
    mediaPipelineQuery.applyPipelineUpdate({ _id: "p2", stage: "refining" } as never)

    const data = queryClient.getQueryData<{ data: { _id: string; stage: string }[] }>(
      pipelineListKey
    )?.data
    expect(data).toEqual([
      { _id: "p2", stage: "refining" },
      { _id: "p1", stage: "video" },
    ])
    expect(queryClient.getQueryData(["mediaPipeline", "detail-p1"])).toEqual({
      _id: "p1",
      stage: "video",
    })
  })
})
