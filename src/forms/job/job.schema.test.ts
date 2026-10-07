import { describe, expect, it } from "vitest"
import { packages } from "@/data/templates"
import { jobFormDefaults, jobFormSchema, jobToFormValues, toJobPayload } from "./job.schema"

const valid = () => ({
  ...jobFormDefaults,
  name: "Weekly posts",
  templates: ["Classic"],
  templateIds: [1],
  topics: ["AI"],
  options: { ...jobFormDefaults.options, performKeywordResearch: true },
})

const issues = (values: unknown) => {
  const r = jobFormSchema.safeParse(values)
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
}

describe("jobFormSchema", () => {
  it("accepts a complete form", () => {
    expect(issues(valid())).toEqual([])
  })

  it("requires a name, 1..7 templates and a topic", () => {
    const found = issues({ ...jobFormDefaults })
    expect(found).toEqual(
      expect.arrayContaining([
        expect.stringContaining("name:"),
        expect.stringContaining("templates:"),
        expect.stringContaining("topics:"),
      ])
    )
    expect(issues({ ...valid(), templates: Array(8).fill("x") })).toContainEqual(
      expect.stringContaining("maximum of 7")
    )
  })

  it("asks for keywords only while keyword research is off", () => {
    const manual = { ...valid(), options: { ...valid().options, performKeywordResearch: false } }
    expect(issues(manual)).toContainEqual(expect.stringContaining("keywords:"))
    expect(issues({ ...manual, keywords: ["seo"] })).toEqual([])
  })

  it("bounds the blog count and reports a blank one", () => {
    expect(issues({ ...valid(), numberOfBlogs: 11 })).toContainEqual(
      expect.stringContaining("between 1 and 10")
    )
    expect(issues({ ...valid(), numberOfBlogs: undefined })).toContainEqual(
      expect.stringContaining("between 1 and 10")
    )
  })

  it.each([
    ["weekly", "daysOfWeek"],
    ["monthly", "daysOfMonth"],
    ["custom", "customDates"],
  ])("a %s schedule needs %s", (type, field) => {
    const values = { ...valid(), schedule: { ...valid().schedule, type } }
    expect(issues(values)).toContainEqual(expect.stringContaining(`schedule.${field}:`))
  })

  it("needs a platform when auto-posting is on and a brand when brand voice is on", () => {
    expect(
      issues({ ...valid(), options: { ...valid().options, automaticPosting: true } })
    ).toContainEqual(expect.stringContaining("postingDefaultType:"))
    expect(issues({ ...valid(), isCheckedBrand: true })).toContainEqual(
      expect.stringContaining("brandId:")
    )
  })
})

describe("toJobPayload", () => {
  it("nests the blog settings under `blogs` with canonical names and drops form-only state", () => {
    const payload = toJobPayload({ ...valid(), referenceLinks: ["https://example.com"] })
    expect(payload.blogs.referenceLinks).toEqual(["https://example.com"])
    expect(payload.blogs.isCheckedBrand).toBe(false)
    expect(payload.blogs.brandId).toBeNull()
    expect(payload.blogs.postingDefaultType).toBeNull()
    expect(payload.options.addCTA).toBe(true)
    expect(payload).not.toHaveProperty("templateIds")
    expect(payload.blogs).not.toHaveProperty("references")
    expect(payload.blogs).not.toHaveProperty("useBrandVoice")
    expect(payload.blogs).not.toHaveProperty("postingType")
    expect(payload.blogs).not.toHaveProperty("enableAdvanced")
    expect(payload.options).not.toHaveProperty("wordpressPosting")
  })

  it("keeps the brand id and platform only while their switches are on", () => {
    const payload = toJobPayload({
      ...valid(),
      isCheckedBrand: true,
      brandId: "b1",
      postingDefaultType: "WORDPRESS",
      options: { ...valid().options, automaticPosting: true },
    })
    expect(payload.blogs.brandId).toBe("b1")
    expect(payload.blogs.postingDefaultType).toBe("WORDPRESS")
  })

  it("zeroes the image count when images are off", () => {
    const payload = toJobPayload({ ...valid(), imageSource: "none", numberOfImages: 6 })
    expect(payload.blogs.numberOfImages).toBe(0)
  })
})

describe("jobToFormValues", () => {
  const stored = {
    name: "J",
    status: "active",
    schedule: { type: "legacy-type", daysOfWeek: [1] },
    blogs: {
      templates: ["Classic"],
      topics: ["a"],
      isCheckedBrand: true,
      brandId: { _id: "b9" },
      referenceLinks: ["https://x.com"],
      postingDefaultType: "WORDPRESS",
    },
    options: { addCTA: false, automaticPosting: true },
  }

  it("flattens a stored job and repairs the awkward fields", () => {
    const values = jobToFormValues(stored)
    expect(values.brandId).toBe("b9")
    expect(values.isCheckedBrand).toBe(true)
    expect(values.referenceLinks).toEqual(["https://x.com"])
    expect(values.schedule.type).toBe("daily")
    expect(values.options.addCTA).toBe(false)
    expect(values.options.automaticPosting).toBe(true)
    expect(values.postingDefaultType).toBe("WORDPRESS")
  })

  it("recovers template ids from stored template names so the grid pre-selects", () => {
    expect(jobToFormValues(stored).templateIds.length).toBeGreaterThan(0)
  })

  it("keeps template ids in the order the templates were stored", () => {
    const [a, b] = packages
    const values = jobToFormValues({ ...stored, blogs: { ...stored.blogs, templates: [b.name, a.name] } })
    expect(values.templateIds).toEqual([b.id, a.id])
  })

  it("round-trips through the payload", () => {
    const values = jobToFormValues({ ...stored, schedule: { type: "weekly", daysOfWeek: [1] } })
    expect(jobFormSchema.safeParse({ ...values, options: { ...values.options, performKeywordResearch: true } }).success).toBe(true)
  })
})
