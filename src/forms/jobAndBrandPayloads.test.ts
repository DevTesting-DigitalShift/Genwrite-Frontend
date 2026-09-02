import { describe, expect, it } from "vitest"
import { jobFormDefaults, jobFormSchema, jobToFormValues, toJobPayload } from "@/forms/jobForm"
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

const jobValues = (overrides: Record<string, any> = {}) => ({
  ...jobFormDefaults,
  name: "Weekly posts",
  blogs: { ...jobFormDefaults.blogs, templates: ["Classic"], topics: ["A topic"] },
  options: { ...jobFormDefaults.options, performKeywordResearch: true },
  ...overrides,
})

describe("jobFormSchema", () => {
  it("requires a name, a template and a topic", () => {
    const result = jobFormSchema.safeParse(jobFormDefaults)
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."))
    expect(paths).toEqual(
      expect.arrayContaining(["name", "blogs.templates", "blogs.topics", "blogs.keywords"])
    )
  })

  it("requires days once the schedule needs them", () => {
    const weekly = jobValues({
      schedule: { ...jobFormDefaults.schedule, type: "weekly" },
    })
    expect(jobFormSchema.safeParse(weekly).success).toBe(false)

    const withDays = jobValues({
      schedule: { ...jobFormDefaults.schedule, type: "weekly", daysOfWeek: [1] },
    })
    expect(jobFormSchema.safeParse(withDays).success).toBe(true)

    const monthly = jobValues({
      schedule: { ...jobFormDefaults.schedule, type: "monthdays" },
    })
    expect(jobFormSchema.safeParse(monthly).success).toBe(false)
  })

  it("only wants a posting platform on an advanced job that posts automatically", () => {
    const posting = jobValues({
      blogs: { ...jobFormDefaults.blogs, templates: ["Classic"], topics: ["t"], enableAdvanced: true },
      options: {
        ...jobFormDefaults.options,
        performKeywordResearch: true,
        wordpressPosting: true,
      },
    })
    expect(jobFormSchema.safeParse(posting).success).toBe(false)
  })
})

describe("toJobPayload", () => {
  it("keeps UI-only state out of the request body", () => {
    const payload = toJobPayload(jobValues({ templateIds: [3], topicInput: "typing" }))
    expect(payload).not.toHaveProperty("templateIds")
    expect(payload).not.toHaveProperty("topicInput")
    expect(payload).not.toHaveProperty("keywordInput")
    expect(payload).not.toHaveProperty("referenceInput")
  })

  it("nulls the brand id in both places unless brand voice is on", () => {
    const off = toJobPayload(jobValues({ blogs: { ...jobValues().blogs, brandId: "abc" } }))
    expect(off.blogs.brandId).toBeNull()
    expect(off.options.brandId).toBeNull()

    const on = toJobPayload(
      jobValues({ blogs: { ...jobValues().blogs, useBrandVoice: true, brandId: "abc" } })
    )
    expect(on.blogs.brandId).toBe("abc")
    expect(on.options.brandId).toBe("abc")
  })

  it("forces the image source to none when images are off", () => {
    const payload = toJobPayload(
      jobValues({ blogs: { ...jobValues().blogs, isCheckedGeneratedImages: false } })
    )
    expect(payload.blogs.imageSource).toBe("none")
  })

  it("fills missing sections when loading an existing job", () => {
    const values = jobToFormValues({ name: "Old job", blogs: { topics: ["x"] } })
    expect(values.blogs.tone).toBe(jobFormDefaults.blogs.tone)
    expect(values.options.wordpressPosting).toBe(false)
    expect(values.schedule.type).toBe("daily")
  })
})

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
