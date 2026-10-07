import { describe, expect, it } from "vitest"
import {
  advancedBlogFormDefaults,
  advancedBlogFormSchema,
  toAdvancedBlogPayload,
} from "./advanced.schema"

const values = (overrides = {}) => ({
  ...advancedBlogFormDefaults,
  template: "Classic",
  templateIds: [1],
  topic: "Cold brew at home",
  title: "How to brew cold brew",
  focusKeywords: ["cold brew"],
  keywords: ["coffee"],
  ...overrides,
})

const withOptions = (overrides: Record<string, boolean>) => ({
  ...advancedBlogFormDefaults.options,
  ...overrides,
})

describe("advancedBlogFormSchema", () => {
  it("requires a template", () => {
    expect(advancedBlogFormSchema.safeParse(values({ template: null })).success).toBe(false)
    expect(advancedBlogFormSchema.safeParse(values()).success).toBe(true)
  })

  it("stops asking for a title and keywords once keyword research is on", () => {
    const bare = { ...advancedBlogFormDefaults, template: "Classic", templateIds: [1], topic: "x" }
    expect(advancedBlogFormSchema.safeParse(bare).success).toBe(false)
    const researched = { ...bare, options: withOptions({ performKeywordResearch: true }) }
    expect(advancedBlogFormSchema.safeParse(researched).success).toBe(true)
  })

  it("requires an uploaded file when the upload source is picked", () => {
    const v = values({ imageSource: "upload" })
    expect(advancedBlogFormSchema.safeParse(v).success).toBe(false)
    expect(advancedBlogFormSchema.safeParse({ ...v, blogImages: [{ name: "a.png" }] }).success).toBe(
      true
    )
  })

  it("requires a platform once automatic posting is on", () => {
    const v = values({ options: withOptions({ automaticPosting: true }) })
    expect(advancedBlogFormSchema.safeParse(v).success).toBe(false)
    expect(advancedBlogFormSchema.safeParse({ ...v, postingDefaultType: "WORDPRESS" }).success).toBe(
      true
    )
  })

  it("requires a brand id once brand voice is on", () => {
    expect(advancedBlogFormSchema.safeParse(values({ isCheckedBrand: true })).success).toBe(false)
    expect(
      advancedBlogFormSchema.safeParse(values({ isCheckedBrand: true, brandId: "abc" })).success
    ).toBe(true)
  })

  it("rejects an invalid reference link", () => {
    expect(
      advancedBlogFormSchema.safeParse(values({ referenceLinks: ["not a url"] })).success
    ).toBe(false)
  })
})

describe("toAdvancedBlogPayload", () => {
  it("keeps form-only state out of the request body", () => {
    expect(toAdvancedBlogPayload(values())).not.toHaveProperty("templateIds")
  })

  it("omits the brand id unless brand voice is on", () => {
    expect(toAdvancedBlogPayload(values({ brandId: "abc" }))).not.toHaveProperty("brandId")
    expect(toAdvancedBlogPayload(values({ isCheckedBrand: true, brandId: "abc" })).brandId).toBe("abc")
  })

  it("omits uploaded files unless the upload source is in use", () => {
    const stock = toAdvancedBlogPayload(
      values({ imageSource: "stock", blogImages: [{ name: "a.png" }] })
    )
    expect(stock).not.toHaveProperty("blogImages")

    const uploaded = toAdvancedBlogPayload(
      values({ imageSource: "upload", blogImages: [{ name: "a.png" }] })
    )
    expect(uploaded.blogImages).toHaveLength(1)
    expect(uploaded.imageSource).toBe("upload")
  })

  it("omits the title and keyword lists when the backend will generate them", () => {
    const payload = toAdvancedBlogPayload(
      values({ options: withOptions({ performKeywordResearch: true }) })
    )
    expect(payload).not.toHaveProperty("title")
    expect(payload).not.toHaveProperty("keywords")
    expect(payload).not.toHaveProperty("focusKeywords")
  })

  it("sends the posting platform only while automatic posting is on", () => {
    const off = toAdvancedBlogPayload(values({ postingDefaultType: "WORDPRESS" }))
    expect(off.postingDefaultType).toBeUndefined()
    expect(off.options.automaticPosting).toBe(false)

    const on = toAdvancedBlogPayload(
      values({ options: withOptions({ automaticPosting: true }), postingDefaultType: "WORDPRESS" })
    )
    expect(on.postingDefaultType).toBe("WORDPRESS")
    expect(on.options.automaticPosting).toBe(true)
  })

  it("zeroes the image count when images are off", () => {
    expect(
      toAdvancedBlogPayload(values({ imageSource: "none", numberOfImages: 5 })).numberOfImages
    ).toBe(0)
  })
})
