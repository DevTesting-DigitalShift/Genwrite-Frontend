import { describe, expect, it } from "vitest"
import { mergeItems, parseCsvItems, splitItems, validateCsvFile } from "./listInput"
import { getYouTubeVideoId, validateLink } from "./links"

describe("splitItems", () => {
  it("splits on commas, semicolons, tabs and newlines", () => {
    expect(splitItems("a, b;c\td\ne\r\n f ,, ")).toEqual(["a", "b", "c", "d", "e", "f"])
  })
})

describe("mergeItems", () => {
  it("de-duplicates case-insensitively, against the list and within the input", () => {
    const r = mergeItems(["SEO"], ["seo", "Blogs", "blogs", "AI"])
    expect(r.next).toEqual(["SEO", "Blogs", "AI"])
    expect(r.duplicates).toEqual(["seo", "blogs"])
  })

  it("stops at max and reports what did not fit", () => {
    const r = mergeItems(["a"], ["b", "c", "d"], { max: 3 })
    expect(r.next).toEqual(["a", "b", "c"])
    expect(r.rejected).toEqual(["d"])
  })
})

describe("parseCsvItems", () => {
  it("drops a header row and takes the first filled cell per line", () => {
    expect(parseCsvItems("Topics\nfirst,x\n,second\n\nthird")).toEqual(["first", "second", "third"])
  })

  it("keeps the first row when it is data", () => {
    expect(parseCsvItems("alpha\nbeta")).toEqual(["alpha", "beta"])
  })
})

describe("validateCsvFile", () => {
  it("rejects missing, non-csv and oversized files", () => {
    expect(validateCsvFile(undefined)).toMatch(/No file/)
    expect(validateCsvFile({ name: "a.txt", size: 1 })).toMatch(/Invalid file type/)
    expect(validateCsvFile({ name: "a.csv", size: 21 * 1024 })).toMatch(/20KB/)
    expect(validateCsvFile({ name: "A.CSV", size: 10 })).toBeNull()
  })
})

describe("links", () => {
  it("extracts YouTube ids from the supported url shapes", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=3")).toBe("dQw4w9WgXcQ")
    expect(getYouTubeVideoId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(getYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull()
  })

  it("validates by kind", () => {
    expect(validateLink("https://example.com", "reference")).toBeNull()
    expect(validateLink("nope", "reference")).toMatch(/valid URL/)
    expect(validateLink("https://example.com", "youtube")).toMatch(/YouTube/)
    expect(validateLink("https://youtu.be/dQw4w9WgXcQ", "youtube")).toBeNull()
  })
})
