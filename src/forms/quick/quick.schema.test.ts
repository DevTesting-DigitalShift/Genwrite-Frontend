import { describe, expect, it } from "vitest"
import { quickBlogFormDefaults, quickBlogFormSchema, toQuickBlogPayload } from "./quick.schema"

const validValues = () => ({
  ...quickBlogFormDefaults("quick"),
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
  it("requires a template, topic and both keyword lists", () => {
    const result = quickBlogFormSchema.safeParse(quickBlogFormDefaults("quick"))
    expect(result.success).toBe(false)
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."))
    expect(paths).toEqual(expect.arrayContaining(["template", "topic", "focusKeywords", "keywords"]))
  })

  it("drops the keyword requirement when keyword research is on", () => {
    expect(quickBlogFormSchema.safeParse(withResearch("quick")).success).toBe(true)
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

  it("speaks the canonical key names", () => {
    const payload = toQuickBlogPayload({
      ...validValues(),
      referenceLinks: ["https://example.com"],
    })
    expect(payload.referenceLinks).toEqual(["https://example.com"])
    expect(payload).not.toHaveProperty("otherLinks")
    expect(payload).not.toHaveProperty("addImages")
    expect(payload.options).toMatchObject({ exactTitle: false, humanisation: false })
    expect(payload.aiModel).toBe("gemini")
    expect(payload.topic).toBe("Sourdough for beginners")
  })

  it("zeroes the image count when images are off", () => {
    const payload = toQuickBlogPayload({ ...validValues(), imageSource: "none", numberOfImages: 6 })
    expect(payload.imageSource).toBe("none")
    expect(payload.numberOfImages).toBe(0)
  })

  it("leaves keyword lists to the backend when research is on", () => {
    const values = validValues()
    const payload = toQuickBlogPayload({
      ...values,
      options: { ...values.options, performKeywordResearch: true },
    })
    expect(payload.keywords).toEqual([])
    expect(payload.focusKeywords).toEqual([])
  })

  it("embeds the source video by default on a YouTube blog", () => {
    expect(quickBlogFormDefaults("yt").options.embedYouTubeVideos).toBe(true)
    expect(quickBlogFormDefaults("quick").options.embedYouTubeVideos).toBe(false)
  })
})
