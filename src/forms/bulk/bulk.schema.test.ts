import { describe, expect, it } from "vitest"
import {
  blogCountForTopics,
  bulkBlogFormDefaults,
  bulkBlogFormSchema,
  toBulkBlogPayload,
} from "./bulk.schema"

const valid = () => ({
  ...bulkBlogFormDefaults,
  templates: ["Classic"],
  templateIds: [1],
  topics: ["a", "b"],
  numberOfBlogs: 2,
})

const issues = (values: unknown) => {
  const r = bulkBlogFormSchema.safeParse(values)
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
}

describe("bulkBlogFormSchema", () => {
  it("accepts a complete form", () => {
    expect(issues(valid())).toEqual([])
  })

  it("requires 1..3 templates", () => {
    expect(issues({ ...valid(), templates: [] })).toContainEqual(
      expect.stringContaining("templates:")
    )
    expect(issues({ ...valid(), templates: ["a", "b", "c", "d"] })).toContainEqual(
      expect.stringContaining("Maximum of 3")
    )
  })

  it("pairs topics 1:1 with the blog count", () => {
    expect(issues({ ...valid(), numberOfBlogs: 3 })).toContainEqual(
      expect.stringContaining("exactly 3 topics")
    )
  })

  it("reports a blank blog count with the usual copy", () => {
    expect(issues({ ...valid(), numberOfBlogs: undefined })).toContainEqual(
      expect.stringContaining("at least 2")
    )
  })

  it("needs keywords only while keyword research is off, but never focus keywords", () => {
    const manual = { ...valid(), options: { ...valid().options, performKeywordResearch: false } }
    const found = issues(manual)
    expect(found).toContainEqual(expect.stringContaining("keywords:"))
    expect(found.some((m) => m.startsWith("focusKeywords"))).toBe(false)
    expect(issues({ ...manual, keywords: ["seo"] })).toEqual([])
  })

  it("needs a brand when brand voice is on, and a platform when auto-posting is on", () => {
    expect(issues({ ...valid(), isCheckedBrand: true })).toContainEqual(
      expect.stringContaining("brandId:")
    )
    const posting = { ...valid(), options: { ...valid().options, automaticPosting: true } }
    expect(issues(posting)).toContainEqual(expect.stringContaining("postingDefaultType:"))
  })
})

describe("blogCountForTopics", () => {
  it("only ever raises the count, up to the maximum", () => {
    expect(blogCountForTopics(4, 3)).toBe(4)
    expect(blogCountForTopics(2, 5)).toBeNull()
    expect(blogCountForTopics(12, 3)).toBe(10)
    expect(blogCountForTopics(2, undefined)).toBe(2)
  })
})

describe("toBulkBlogPayload", () => {
  it("speaks the canonical names and keeps form-only state out", () => {
    const payload = toBulkBlogPayload({
      ...valid(),
      options: { ...valid().options, includeCompetitorResearch: true, automaticPosting: true },
      postingDefaultType: "WORDPRESS",
    })
    expect(payload.options.includeCompetitorResearch).toBe(true)
    expect(payload.options.automaticPosting).toBe(true)
    expect(payload.postingDefaultType).toBe("WORDPRESS")
    expect(payload).not.toHaveProperty("templateIds")
    expect(payload).not.toHaveProperty("useCompetitors")
    expect(payload).not.toHaveProperty("wordpressPostStatus")
    expect(payload).not.toHaveProperty("isCheckedGeneratedImages")
  })

  it("drops the brand id and platform when their switches are off", () => {
    const payload = toBulkBlogPayload({ ...valid(), brandId: "stale", postingDefaultType: "WIX" })
    expect(payload).not.toHaveProperty("brandId")
    expect(payload.postingDefaultType).toBeUndefined()
  })

  it("fills in the post frequency the form never asks for", () => {
    expect(toBulkBlogPayload(valid()).postFrequency).toBe(600)
  })

  it("zeroes the image count when images are off", () => {
    const payload = toBulkBlogPayload({ ...valid(), imageSource: "none", numberOfImages: 7 })
    expect(payload.numberOfImages).toBe(0)
  })

  it("only keeps createBrandedImages with a brand voice", () => {
    const withoutBrand = toBulkBlogPayload({
      ...valid(),
      imageSource: "ai",
      options: { ...valid().options, createBrandedImages: true },
    })
    expect(withoutBrand.options.createBrandedImages).toBe(false)

    const stock = toBulkBlogPayload({
      ...valid(),
      isCheckedBrand: true,
      brandId: "b",
      imageSource: "stock",
      options: { ...valid().options, createBrandedImages: true },
    })
    expect(stock.options.createBrandedImages).toBe(false)

    const branded = toBulkBlogPayload({
      ...valid(),
      isCheckedBrand: true,
      brandId: "b",
      imageSource: "ai",
      options: { ...valid().options, createBrandedImages: true },
    })
    expect(branded.options.createBrandedImages).toBe(true)
  })
})
