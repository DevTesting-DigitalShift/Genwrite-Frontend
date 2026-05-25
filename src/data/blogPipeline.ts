// Full ordered pipeline — must stay in sync with AIBlogServiceV2 #allSteps
export const ALL_PIPELINE_STEPS = [
  "keyword-research",
  "outsource",
  "context",
  "outline",
  "deep-research",
  "content",
  "humanisation",
  "images-alt_texts",
  "seo-metadata",
  "slug-generation",
  "final-merge",
  "posting",
] as const

export type PipelineStep = (typeof ALL_PIPELINE_STEPS)[number]

export const PIPELINE_STEP_LABELS: Record<string, string> = {
  "keyword-research": "Keyword Research",
  outsource: "Content Research",
  context: "Context Analysis",
  outline: "Outline Generation",
  "deep-research": "Deep Research",
  content: "AI Content Generation",
  humanisation: "Humanising Content",
  "images-alt_texts": "Image Alt Texts",
  "seo-metadata": "SEO Metadata",
  "slug-generation": "Slug Generation",
  "final-merge": "Final Assembly",
  posting: "Auto Posting",
}

// Tasks whose failure is non-critical (blog content is still usable)
export const NON_CRITICAL_TASKS = new Set(["images-alt_texts", "posting"])