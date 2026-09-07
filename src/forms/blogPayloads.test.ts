import { describe, expect, it } from "vitest"
import {
  advancedBlogFormDefaults,
  advancedBlogFormSchema,
  toAdvancedBlogPayload,
} from "@/forms/advancedBlogForm"
import { bulkBlogFormDefaults, bulkBlogFormSchema, toBulkBlogPayload } from "@/forms/bulkBlogForm"

const advancedValues = (overrides = {}) => ({
  ...advancedBlogFormDefaults,
  template: "Classic",
  templateIds: [1],
  topic: "Cold brew at home",
  title: "How to brew cold brew",
  focusKeywords: ["cold brew"],
  keywords: ["coffee"],
  ...overrides,
})

const bulkValues = (overrides = {}) => ({
  ...bulkBlogFormDefaults,
  templates: ["Classic"],
  templateIds: [1],
  topics: ["A topic"],
  numberOfBlogs: 1,
  ...overrides,
})

describe("advancedBlogFormSchema", () => {
  it("requires exactly one template", () => {
    const none = advancedBlogFormSchema.safeParse(advancedValues({ templateIds: [] }))
    expect(none.success).toBe(false)

    const two = advancedBlogFormSchema.safeParse(advancedValues({ templateIds: [1, 2] }))
    expect(two.success).toBe(false)
  })

  it("stops asking for a title and keywords once keyword research is on", () => {
    const bare = { ...advancedBlogFormDefaults, template: "Classic", templateIds: [1], topic: "x" }
    expect(advancedBlogFormSchema.safeParse(bare).success).toBe(false)

    const researched = {
      ...bare,
      options: { ...advancedBlogFormDefaults.options, performKeywordResearch: true },
    }
    expect(advancedBlogFormSchema.safeParse(researched).success).toBe(true)
  })

  it("requires an uploaded file when the upload source is picked", () => {
    const values = advancedValues({ isCheckedGeneratedImages: true, imageSource: "upload" })
    expect(advancedBlogFormSchema.safeParse(values).success).toBe(false)
    expect(
      advancedBlogFormSchema.safeParse({ ...values, blogImages: [{ name: "a.png" }] }).success
    ).toBe(true)
  })

  it("requires a platform once automatic posting is on", () => {
    const values = advancedValues({ wordpressPostStatus: true })
    expect(advancedBlogFormSchema.safeParse(values).success).toBe(false)
    expect(
      advancedBlogFormSchema.safeParse({ ...values, postingType: "WORDPRESS" }).success
    ).toBe(true)
  })
})

describe("toAdvancedBlogPayload", () => {
  it("keeps UI-only state out of the request body", () => {
    const payload = toAdvancedBlogPayload(advancedValues())
    expect(payload).not.toHaveProperty("templateIds")
    expect(payload).not.toHaveProperty("enableAdvanced")
  })

  it("omits the brand id unless brand voice is on", () => {
    expect(toAdvancedBlogPayload(advancedValues({ brandId: "abc" }))).not.toHaveProperty("brandId")

    const withBrand = toAdvancedBlogPayload(
      advancedValues({ isCheckedBrand: true, brandId: "abc" })
    )
    expect(withBrand.brandId).toBe("abc")
  })

  it("omits uploaded files unless the upload source is in use", () => {
    const stock = toAdvancedBlogPayload(
      advancedValues({
        isCheckedGeneratedImages: true,
        imageSource: "stock",
        blogImages: [{ name: "a.png" }],
      })
    )
    expect(stock).not.toHaveProperty("blogImages")

    const uploaded = toAdvancedBlogPayload(
      advancedValues({
        isCheckedGeneratedImages: true,
        imageSource: "upload",
        blogImages: [{ name: "a.png" }],
      })
    )
    expect(uploaded.blogImages).toHaveLength(1)
    expect(uploaded.imageSource).toBe("upload")
  })

  it("omits the title and keyword lists when the backend will generate them", () => {
    const payload = toAdvancedBlogPayload(
      advancedValues({
        options: { ...advancedBlogFormDefaults.options, performKeywordResearch: true },
      })
    )
    expect(payload).not.toHaveProperty("title")
    expect(payload).not.toHaveProperty("keywords")
    expect(payload).not.toHaveProperty("focusKeywords")
  })

  it("sends the posting platform only with automatic posting on", () => {
    expect(toAdvancedBlogPayload(advancedValues({ postingType: "WORDPRESS" }))).not.toHaveProperty(
      "postingType"
    )

    const posting = toAdvancedBlogPayload(
      advancedValues({ wordpressPostStatus: true, postingType: "WORDPRESS" })
    )
    expect(posting.postingType).toBe("WORDPRESS")
  })
})

describe("bulkBlogFormSchema", () => {
  it("requires one topic per blog", () => {
    const mismatch = bulkBlogFormSchema.safeParse(bulkValues({ numberOfBlogs: 2 }))
    expect(mismatch.success).toBe(false)
    const message = mismatch.success
      ? ""
      : mismatch.error.issues.find((i) => i.path[0] === "topics")?.message
    expect(message).toContain("exactly 2 topics")
  })

  it("rejects a blank blog count", () => {
    expect(bulkBlogFormSchema.safeParse(bulkValues({ numberOfBlogs: "" })).success).toBe(false)
  })

  it("only demands keywords while keyword research is off", () => {
    const manual = bulkValues({ performKeywordResearch: false })
    expect(bulkBlogFormSchema.safeParse(manual).success).toBe(false)
    expect(bulkBlogFormSchema.safeParse({ ...manual, keywords: ["seo"] }).success).toBe(true)
  })
})

describe("toBulkBlogPayload", () => {
  it("keeps UI-only state out of the request body", () => {
    const payload = toBulkBlogPayload(bulkValues({ topicInput: "typing", isDragging: true }))
    expect(payload).not.toHaveProperty("templateIds")
    expect(payload).not.toHaveProperty("topicInput")
    expect(payload).not.toHaveProperty("keywordInput")
    expect(payload).not.toHaveProperty("isDragging")
    expect(payload).not.toHaveProperty("enableAdvanced")
  })

  it("sends competitor research under the name the endpoint expects", () => {
    const payload = toBulkBlogPayload(bulkValues({ includeCompetitorResearch: true }))
    expect(payload.useCompetitors).toBe(true)
    expect(payload).not.toHaveProperty("includeCompetitorResearch")
  })

  it("fills in the post frequency the modal never asks for", () => {
    expect(toBulkBlogPayload(bulkValues()).postFrequency).toBe(600)
  })

  it("drops the empty image list and forces imageSource to none", () => {
    const payload = toBulkBlogPayload(bulkValues({ isCheckedGeneratedImages: false }))
    expect(payload).not.toHaveProperty("blogImages")
    expect(payload.imageSource).toBe("none")
  })
})
