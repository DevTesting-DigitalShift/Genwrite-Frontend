import { describe, expect, it } from "vitest"
import { quickBlogFormDefaults, quickBlogFormSchema, toQuickBlogPayload } from "./quick.schema"

const validValues = () => ({
  ...quickBlogFormDefaults("quick"),
  options: { ...quickBlogFormDefaults("quick").options, performKeywordResearch: false },
  topic: "  Sourdough for beginners  ",
  template: "Classic",
  templateIds: [1],
  focusKeywords: ["sourdough"],
  keywords: ["baking"],
})

const withResearch = (type: "quick" | "yt") => {
  const base = quickBlogFormDefaults(type)
  return {
    ...base,
    topic: "T",
    template: "Classic",
    options: { ...base.options, performKeywordResearch: true },
  }
}

describe("quickBlogFormSchema", () => {
  it("requires a template, topic and both keyword lists once research is off", () => {
    const base = quickBlogFormDefaults("quick")
    const result = quickBlogFormSchema.safeParse({
      ...base,
      options: { ...base.options, performKeywordResearch: false },
    })
    expect(result.success).toBe(false)
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."))
    expect(paths).toEqual(
      expect.arrayContaining(["template", "topic", "focusKeywords", "keywords"])
    )
  })

  it("drops the keyword requirement when keyword research is on", () => {
    expect(quickBlogFormSchema.safeParse(withResearch("quick")).success).toBe(true)
  })

  it("needs neither a template nor keywords for a yt blog", () => {
    const base = quickBlogFormDefaults("yt")
    const ok = quickBlogFormSchema.safeParse({
      ...base,
      topic: "T",
      referenceLinks: ["https://youtu.be/abcdefghijk"],
    })
    expect(ok.success).toBe(true)
  })

  it("requires a valid YouTube link for a yt blog", () => {
    expect(quickBlogFormSchema.safeParse(withResearch("yt")).success).toBe(false)

    const notYouTube = quickBlogFormSchema.safeParse({
      ...withResearch("yt"),
      referenceLinks: ["https://example.com"],
    })
    expect(notYouTube.success).toBe(false)

    const ok = quickBlogFormSchema.safeParse({
      ...withResearch("yt"),
      referenceLinks: ["https://youtu.be/abcdefghijk"],
    })
    expect(ok.success).toBe(true)
  })

  it("accepts any URL as a reference link on a quick blog", () => {
    const ok = quickBlogFormSchema.safeParse({
      ...withResearch("quick"),
      referenceLinks: ["https://example.com/post"],
    })
    expect(ok.success).toBe(true)
  })
})

describe("toQuickBlogPayload", () => {
  it("keeps form-only state out of the request body", () => {
    const payload = toQuickBlogPayload(validValues())
    expect(payload).not.toHaveProperty("templateIds")
  })

  it("sends only what the user chose — the backend fills the quick defaults", () => {
    const payload = toQuickBlogPayload({
      ...validValues(),
      referenceLinks: ["https://example.com"],
    })
    expect(payload).toEqual({
      type: "quick",
      topic: "Sourdough for beginners",
      template: "Classic",
      keywords: ["baking"],
      focusKeywords: ["sourdough"],
      referenceLinks: ["https://example.com"],
      options: { exactTitle: true, performKeywordResearch: false },
    })
  })

  it("leaves keyword lists to the backend when research is on", () => {
    const values = validValues()
    const payload = toQuickBlogPayload({
      ...values,
      options: { ...values.options, performKeywordResearch: true },
    })
    expect(payload.keywords).toEqual([])
    expect(payload.focusKeywords).toEqual([])
    expect(payload.options.performKeywordResearch).toBe(true)
  })

  it("sends a YouTube blog without a template or keywords — the videos decide them", () => {
    const payload = toQuickBlogPayload({
      ...quickBlogFormDefaults("yt"),
      topic: "From the video",
      template: "Classic",
      keywords: ["ignored"],
      referenceLinks: ["https://youtu.be/abcdefghijk"],
    })
    expect(payload).not.toHaveProperty("template")
    expect(payload.keywords).toEqual([])
    expect(payload.options).toEqual({ exactTitle: true, performKeywordResearch: false })
  })

  it("defaults match the backend: research on for quick, embeds on for YouTube, exact title on", () => {
    expect(quickBlogFormDefaults("quick").options).toMatchObject({
      performKeywordResearch: true,
      exactTitle: true,
      embedYouTubeVideos: false,
    })
    expect(quickBlogFormDefaults("yt").options).toMatchObject({
      performKeywordResearch: false,
      exactTitle: true,
      embedYouTubeVideos: true,
    })
  })
})
