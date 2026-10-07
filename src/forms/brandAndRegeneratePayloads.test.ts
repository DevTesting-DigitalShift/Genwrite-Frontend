import { describe, expect, it } from "vitest"
import {
  brandVoiceFormDefaults,
  brandVoiceFormSchema,
  toBrandVoicePayload,
} from "@/forms/brandVoiceForm"
import {
  regenerateBlogFormDefaults,
  regenerateBlogFormSchema,
  toRegenerateBlogPayload,
} from "@/forms/regenerateBlogForm"

describe("brandVoiceFormSchema", () => {
  it("names every missing field", () => {
    const result = brandVoiceFormSchema.safeParse(brandVoiceFormDefaults)
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."))
    expect(paths).toEqual(
      expect.arrayContaining([
        "nameOfVoice",
        "postLink",
        "sitemapUrl",
        "describeBrand",
        "persona",
        "keywords",
      ])
    )
  })

  it("rejects a link that is not a URL", () => {
    const result = brandVoiceFormSchema.safeParse({
      ...brandVoiceFormDefaults,
      nameOfVoice: "Acme",
      postLink: "acme",
      sitemapUrl: "https://acme.com/sitemap.xml",
      describeBrand: "We make things",
      persona: "Builders",
      keywords: ["acme"],
    })
    const message = result.success
      ? ""
      : result.error.issues.find((i) => i.path[0] === "postLink")?.message
    expect(message).toContain("valid URL")
  })
})

describe("toBrandVoicePayload", () => {
  it("renames sitemapUrl, drops the logo cache-buster and page state", () => {
    const payload = toBrandVoicePayload({
      ...brandVoiceFormDefaults,
      nameOfVoice: " Acme ",
      postLink: "https://acme.com",
      sitemapUrl: "https://acme.com/sitemap.xml",
      describeBrand: "We make things",
      persona: "Builders",
      keywords: [" acme ", ""],
      logoUrl: "https://cdn.acme.com/logo.png?t=123",
      _id: "abc",
      selectedVoice: { _id: "abc" },
    })

    expect(payload.sitemap).toBe("https://acme.com/sitemap.xml")
    expect(payload).not.toHaveProperty("sitemapUrl")
    expect(payload).not.toHaveProperty("_id")
    expect(payload).not.toHaveProperty("selectedVoice")
    expect(payload.nameOfVoice).toBe("Acme")
    expect(payload.keywords).toEqual(["acme"])
    expect(payload.logoUrl).toBe("https://cdn.acme.com/logo.png")
  })
})

describe("toRegenerateBlogPayload", () => {
  const regenValues = (overrides: Record<string, any> = {}) => ({
    ...regenerateBlogFormDefaults,
    topic: "Cold brew",
    tone: "Professional",
    ...overrides,
  })

  it("always asks for new content and rounds the length to the nearest 500", () => {
    const payload = toRegenerateBlogPayload(regenValues({ userDefinedLength: 1240 }))
    expect(payload.createNew).toBe(true)
    expect(payload.userDefinedLength).toBe(1000)
  })

  it("keeps brand and posting fields out unless they are switched on", () => {
    const payload = toRegenerateBlogPayload(regenValues({ brandId: "abc" }))
    expect(payload).not.toHaveProperty("brandId")
    expect(payload).not.toHaveProperty("postingDefaultType")
  })

  it("sends the options the modal collects, including branded images", () => {
    const payload = toRegenerateBlogPayload(
      regenValues({
        options: { ...regenerateBlogFormDefaults.options, createBrandedImages: true },
      })
    )
    expect(payload.options.createBrandedImages).toBe(true)
  })

  it("requires a valid brand id when brand voice is on", () => {
    const bad = regenerateBlogFormSchema.safeParse(regenValues({ isCheckedBrand: true }))
    expect(bad.success).toBe(false)

    const good = regenerateBlogFormSchema.safeParse(
      regenValues({ isCheckedBrand: true, brandId: "0123456789abcdef01234567" })
    )
    expect(good.success).toBe(true)
  })
})
