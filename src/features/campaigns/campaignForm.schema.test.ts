import { describe, expect, it } from "vitest"
import { campaignFormDefaultValues, campaignFormSchema } from "./campaignForm.schema"

function validValues(overrides: Partial<typeof campaignFormDefaultValues> = {}) {
  return {
    ...campaignFormDefaultValues,
    name: "Q1 SEO Push",
    description: "Grow organic traffic",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    targets: { clicks: 1000, impressions: null, avgPosition: null, keywords: [] },
    ...overrides,
  }
}

describe("campaignFormSchema — blogIds/jobIds", () => {
  it("rejects when both blogIds and jobIds are empty", () => {
    const result = campaignFormSchema.safeParse(validValues({ blogIds: [], jobIds: [] }))
    expect(result.success).toBe(false)
  })

  it("accepts blogIds alone with no jobIds", () => {
    const result = campaignFormSchema.safeParse(validValues({ blogIds: ["blog-1"], jobIds: [] }))
    expect(result.success).toBe(true)
  })

  it("accepts jobIds alone with no blogIds", () => {
    const result = campaignFormSchema.safeParse(validValues({ blogIds: [], jobIds: ["job-1"] }))
    expect(result.success).toBe(true)
  })
})
