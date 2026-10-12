import { describe, expect, it } from "vitest"
import {
  DEFAULT_UGC_SETTINGS,
  DEFAULT_UGC_STRUCTURE,
  structureSeconds,
  ugcPayload,
  usableScript,
} from "./ugcAd"

describe("ugcPayload", () => {
  it("is absent for a single clip", () => {
    expect(ugcPayload(DEFAULT_UGC_SETTINGS)).toBeUndefined()
  })

  it("sends the scene structure for a multi-scene ad", () => {
    expect(ugcPayload({ ...DEFAULT_UGC_SETTINGS, mode: "multi" })).toEqual({
      structure: DEFAULT_UGC_STRUCTURE,
      pacing: "natural",
      masterAudio: true,
    })
  })

  it("sends a pasted script instead of the structure", () => {
    const script = "IMAGE PROMPT: a woman in a kitchen\nVIDEO PROMPT: 0-3s she smiles"
    const payload = ugcPayload({ ...DEFAULT_UGC_SETTINGS, mode: "multi", script: `  ${script}  ` })
    expect(payload).toEqual({ script, pacing: "natural", masterAudio: true })
  })

  it("ignores a script too short for the backend to accept", () => {
    expect(usableScript("too short")).toBeUndefined()
    const payload = ugcPayload({ ...DEFAULT_UGC_SETTINGS, mode: "multi", script: "too short" })
    expect(payload).toHaveProperty("structure")
  })
})

describe("structureSeconds", () => {
  it("adds up the scenes", () => {
    expect(structureSeconds(DEFAULT_UGC_STRUCTURE)).toBe(16)
  })
})
