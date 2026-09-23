import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

/**
 * Snapshot of GET /user/pricing's catalogue — used ONLY until the live catalogue loads (see
 * usePricingStore), or if that request fails, so cost labels never render empty. The backend
 * is the source of truth: a price or fal model change there reaches the UI on the next page
 * load without touching this file. Refresh it occasionally so the first paint is accurate.
 */
export const PRICING_FALLBACK: PricingCatalogue = {
  blog: {
    wordCount: { base: 100, cost: 10 },
    features: {
      brandVoice: { label: "Brand Voice", cost: 10 },
      competitorResearch: { label: "Competitor Research", cost: 10 },
      keywordResearch: { label: "Keyword Research", cost: 10 },
      internalLinking: { label: "Internal Linking", cost: 10 },
      faqGeneration: { label: "FAQ Generation", cost: 10 },
      automaticPosting: { label: "Automatic Posting", cost: 10 },
      humanisation: { label: "AI Humanisation", cost: 20 },
      extendedThinking: { label: "Extended Thinking", cost: 15 },
      deepResearch: { label: "Deep Research", cost: 15 },
    },
    images: { stock: { featureFee: 10 }, ai: { featureFee: 20 }, upload: { perImageFee: 5 } },
    aiModels: {
      gemini: { label: "Gemini", costMultiplier: 1 },
      openai: { label: "OpenAI", costMultiplier: 1.25 },
      chatgpt: { label: "ChatGPT", costMultiplier: 1.25 },
      claude: { label: "Claude", costMultiplier: 1.5 },
    },
  },
  generate: {
    METADATA: 1,
    HUMANISED_CONTENT: 5,
    OUTLINE: 10,
    PROMPT_CONTENT: 5,
    DETECTOR: 2,
    KEYWORD_SCRAPER: 5,
    YOUTUBE_SUMMARIZER: 5,
    PDF_CHAT: 1,
    COMPETITOR_LIKE_BLOG: 10,
    WEBSITE_RANKING: {
      ANALYSER: 3,
      PROMPT_CREATOR: 2,
      RANK_CHECKER_PER_PROMPT: 1,
      ADVANCED_ANALYSIS: 3,
      ORCHESTRATOR_BASE: 8,
    },
  },
  blogGeneration: {
    PROOFREAD: 5,
    REWRITE: 3,
    SECTION_TASK: { PROOFREAD: 10, REWRITE: 10, ANALYSIS: 10, PROMPT: 10 },
  },
  images: { GENERATE: 2, ALT_TEXT: 2, ENHANCE_PRO: 5 },
  media: {
    "fal-ai/nano-banana": {
      kind: "image",
      unit: "megapixel",
      usdPerUnit: 0.0398,
      label: "Nano Banana",
    },
    "fal-ai/bytedance/seedream/v4/text-to-image": {
      kind: "image",
      unit: "image",
      usdPerUnit: 0.03,
      label: "Seedream V4",
    },
    "fal-ai/flux-pro/kontext": {
      kind: "image",
      unit: "image",
      usdPerUnit: 0.04,
      label: "Flux Kontext Pro",
    },
    "fal-ai/qwen-image": {
      kind: "image",
      unit: "megapixel",
      usdPerUnit: 0.02,
      label: "Qwen Image",
    },
    "fal-ai/hidream-o1-image": {
      kind: "image",
      unit: "megapixel",
      usdPerUnit: 0.01,
      label: "HiDream (Text-to-Image)",
    },
    "fal-ai/hidream-o1-image/edit": {
      kind: "image",
      unit: "megapixel",
      usdPerUnit: 0.01,
      label: "HiDream (Image-to-Image)",
      requiresImage: true,
    },
    "fal-ai/wan-25-preview/text-to-video": {
      kind: "video",
      unit: "second",
      usdPerUnit: 0.05,
      label: "Wan 2.5",
    },
    "fal-ai/kling-video/v2.5-turbo/pro/text-to-video": {
      kind: "video",
      unit: "second",
      usdPerUnit: 0.07,
      label: "Kling 2.5 Turbo Pro",
    },
    "fal-ai/veo3.1": { kind: "video", unit: "second", usdPerUnit: 0.4, label: "Veo 3" },
    "fal-ai/ovi": { kind: "video", unit: "video", usdPerUnit: 0.2, label: "Ovi" },
  },
  analysis: { COMPETITORS: 10 },
  job: { FROM_RANKING: 1 },
  analytics: { ANALYZE: 10, APPLY: 10 },
}
