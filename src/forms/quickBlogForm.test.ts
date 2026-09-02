import { describe, expect, it } from "vitest"
import {
  quickBlogFormDefaults,
  quickBlogFormSchema,
  toQuickBlogPayload,
} from "@/forms/quickBlogForm"

const validValues = () => ({
  ...quickBlogFormDefaults("quick"),
  topic: "  Sourdough for beginners  ",
  template: "Classic",
  templateIds: [1],
  focusKeywords: ["sourdough"],
  keywords: ["baking"],
  keywordInput: "half typed",
  enableAdvanced: true,
})

describe("quickBlogFormSchema", () => {
  it("requires a template, topic and both keyword lists", () => {
    const result = quickBlogFormSchema.safeParse(quickBlogFormDefaults("quick"))
    expect(result.success).toBe(false)
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."))
    expect(paths).toEqual(
      expect.arrayContaining(["template", "topic", "focusKeywords", "keywords"])
    )
  })

  it("drops the keyword requirement when keyword research is on", () => {
    const result = quickBlogFormSchema.safeParse({
      ...quickBlogFormDefaults("quick"),
      topic: "Anything",
      template: "Classic",
      performKeywordResearch: true,
    })
    expect(result.success).toBe(true)
  })

  it("requires a video link for a YouTube blog", () => {
    const base = { ...quickBlogFormDefaults("yt"), topic: "T", template: "Classic" }
    const withoutLink = quickBlogFormSchema.safeParse({ ...base, performKeywordResearch: true })
    expect(withoutLink.success).toBe(false)

    const withLink = quickBlogFormSchema.safeParse({
      ...base,
      performKeywordResearch: true,
      otherLinks: ["https://youtu.be/abcdefghijk"],
    })
    expect(withLink.success).toBe(true)
  })
})

describe("toQuickBlogPayload", () => {
  it("keeps UI-only state out of the request body", () => {
    const payload = toQuickBlogPayload(validValues())
    expect(payload).not.toHaveProperty("templateIds")
    expect(payload).not.toHaveProperty("enableAdvanced")
    expect(payload).not.toHaveProperty("keywordInput")
    expect(payload).not.toHaveProperty("focusKeywordInput")
    expect(payload).not.toHaveProperty("otherLinkInput")
  })

  it("trims the topic and forces imageSource to none when images are off", () => {
    const payload = toQuickBlogPayload(validValues())
    expect(payload.topic).toBe("Sourdough for beginners")
    expect(payload.imageSource).toBe("none")
  })

  it("keeps the chosen image source when images are on", () => {
    const payload = toQuickBlogPayload({
      ...validValues(),
      addImages: true,
      imageSource: "ai",
    })
    expect(payload.imageSource).toBe("ai")
  })

  it("marks a YouTube blog with its type and links", () => {
    const payload = toQuickBlogPayload({
      ...validValues(),
      type: "yt",
      otherLinks: ["https://youtu.be/abcdefghijk"],
    })
    expect(payload.type).toBe("yt")
    expect(payload.otherLinks).toEqual(["https://youtu.be/abcdefghijk"])
    expect(payload.embedYouTubeVideos).toBe(false)
  })
})
