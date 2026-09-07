import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { PayloadValidationError, buildPayload, includeIf, stripUndefined } from "./payload"

const schema = z.object({
  name: z.string(),
  count: z.number().default(0),
  optional: z.string().optional(),
})

describe("stripUndefined", () => {
  it("removes undefined keys at every level and leaves nulls alone", () => {
    expect(
      stripUndefined({ a: 1, b: undefined, c: null, d: { e: undefined, f: 2 } })
    ).toEqual({ a: 1, c: null, d: { f: 2 } })
  })

  it("keeps array positions and class instances intact", () => {
    const file = new File(["x"], "a.png")
    const result = stripUndefined({ items: [1, undefined, 3], file })
    expect(result.items).toHaveLength(3)
    expect(result.file).toBe(file)
  })
})

describe("buildPayload", () => {
  it("drops keys the payload schema does not declare", () => {
    const payload = buildPayload("Test", schema, { name: "a", uiOnly: "typing" })
    expect(payload).toEqual({ name: "a", count: 0 })
  })

  it("drops optional keys the mapper resolved to undefined", () => {
    const payload = buildPayload("Test", schema, { name: "a", optional: undefined })
    expect(payload).not.toHaveProperty("optional")
  })

  it("throws with the failing paths rather than sending a wrong body", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect(() => buildPayload("Test", schema, { name: 1 })).toThrow(PayloadValidationError)
      expect(() => buildPayload("Test", schema, { name: 1 })).toThrow(/name/)
    } finally {
      spy.mockRestore()
    }
  })
})

describe("includeIf", () => {
  it("returns the value only while the condition holds", () => {
    expect(includeIf(true, "abc")).toBe("abc")
    expect(includeIf(false, "abc")).toBeUndefined()
    expect(includeIf("", "abc")).toBeUndefined()
  })
})
