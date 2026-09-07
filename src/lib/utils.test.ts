import { describe, expect, it } from "vitest"
import { cn, isEqual } from "./utils"

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("drops falsy values", () => {
    const isActive = false
    expect(cn("a", isActive && "b", null, undefined, "c")).toBe("a c")
  })

  it("lets the later tailwind class win on conflict", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })
})

// These cover the cases Profile.jsx actually relies on, since this replaced
// lodash-es/isEqual.
describe("isEqual", () => {
  const profile = () => ({
    profilePicture: "",
    personalDetails: { name: "a", interests: ["seo", "ai"], dob: "" },
    subscription: { plan: "free", status: "active" },
    emailVerified: false,
  })

  it("treats identical nested objects as equal", () => {
    expect(isEqual(profile(), profile())).toBe(true)
  })

  it("detects a changed nested value", () => {
    const b = profile()
    b.personalDetails.name = "z"
    expect(isEqual(profile(), b)).toBe(false)
  })

  it("compares arrays by order", () => {
    expect(isEqual(["seo", "ai"], ["seo", "ai"])).toBe(true)
    expect(isEqual(["seo", "ai"], ["ai", "seo"])).toBe(false)
    expect(isEqual(["seo"], ["seo", "ai"])).toBe(false)
    expect(isEqual([], [])).toBe(true)
  })

  it("handles primitives and null", () => {
    expect(isEqual(1, 1)).toBe(true)
    expect(isEqual("a", "b")).toBe(false)
    expect(isEqual(null, null)).toBe(true)
    expect(isEqual(null, {})).toBe(false)
    expect(isEqual(undefined, null)).toBe(false)
  })

  it("does not treat an array and an object as equal", () => {
    expect(isEqual([], {})).toBe(false)
  })

  it("requires the same key set", () => {
    expect(isEqual({ a: 1 }, { b: 1 })).toBe(false)
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })
})
