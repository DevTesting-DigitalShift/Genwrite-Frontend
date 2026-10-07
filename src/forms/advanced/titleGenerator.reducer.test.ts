import { describe, expect, it } from "vitest"
import { initialTitleGeneratorState, titleGeneratorReducer } from "./titleGenerator.reducer"

describe("titleGeneratorReducer", () => {
  it("keeps the previous suggestions while a new batch is requested", () => {
    const withTitles = titleGeneratorReducer(initialTitleGeneratorState, {
      type: "GENERATE_SUCCEEDED",
      titles: ["a"],
    })
    const next = titleGeneratorReducer(withTitles, { type: "GENERATE_START" })
    expect(next).toEqual({ titles: ["a"], isGenerating: true })
  })

  it("replaces the suggestions on success and keeps them on failure", () => {
    const loading = { titles: ["old"], isGenerating: true }
    expect(titleGeneratorReducer(loading, { type: "GENERATE_SUCCEEDED", titles: ["new"] })).toEqual({
      titles: ["new"],
      isGenerating: false,
    })
    expect(titleGeneratorReducer(loading, { type: "GENERATE_FAILED" })).toEqual({
      titles: ["old"],
      isGenerating: false,
    })
  })
})
