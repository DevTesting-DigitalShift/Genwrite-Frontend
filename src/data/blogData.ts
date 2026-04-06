// Image Source Types must be defined before usage
export const IMAGE_SOURCE = Object.freeze({
  NONE: "none",
  STOCK: "stock",
  AI: "ai",
  UPLOAD: "upload",
})

export const IMAGE_SOURCE_VALUES = Object.freeze(Object.values(IMAGE_SOURCE))

export const DEFAULT_IMAGE_SOURCE = IMAGE_SOURCE.NONE

export const TONES = [
  "Casual",
  "Conversational",
  "Empathetic",
  "Formal",
  "Friendly",
  "Informative",
  "Inspirational",
  "Persuasive",
  "Professional",
  "Witty",
]

export const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" },
  { value: "French", label: "French" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Dutch", label: "Dutch" },
  { value: "Japanese", label: "Japanese" },
  { value: "Hindi", label: "Hindi" },
  { value: "Chinese", label: "Chinese" },
]

export const AI_MODELS = [
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.webp", restrictedPlans: [] },
  { id: "openai", label: "ChatGPT", logo: "/Images/chatgpt.webp", restrictedPlans: ["free"] },
  {
    id: "claude",
    label: "Claude",
    logo: "/Images/claude.webp",
    restrictedPlans: ["free", "basic"],
  },
]

export const IMAGE_OPTIONS = [
  {
    id: IMAGE_SOURCE.NONE,
    label: "None",
    description: "No images will be generated for the blog.",
    restrictedPlans: [],
  },
  {
    id: IMAGE_SOURCE.STOCK,
    label: "Stock Images",
    description: "High-quality professional stock photos.",
    restrictedPlans: [],
  },
  {
    id: IMAGE_SOURCE.AI,
    label: "AI Images",
    description: "Unique visuals powered by AI.",
    restrictedPlans: ["free"],
  },
  {
    id: IMAGE_SOURCE.UPLOAD,
    label: "Custom Images",
    description: "Upload your own images to include in the blog.",
    restrictedPlans: [],
  },
]

export const VALID_IMAGE_CONFIG = {
  types: ["image/png", "image/jpeg", "image/webp"],
  max_size: 1 * 1024 * 1024, // 1 MB in bytes
  max_files: 15,
}

// Credit Costs for AI Operations (Synced with Backend)
export const COSTS = Object.freeze({
  ANALYSIS: { COMPETITORS: 10, KEYWORDS: 10 },
  BLOG: {
    PROOFREAD: 5,
    REWRITE: 3,
    METADATA: 5,
    HUMANISED_CONTENT: 20,
    OUTLINE: 10,
    PROMPT_CONTENT: 5,
    QUICK: 10,
    SINGLE: 10,
    REGENERATE: 15,
  },
  SECTION_TASK: { PROOFREAD: 10, REWRITE: 10, ANALYSIS: 10, PROMPT: 10 },
  TOOLS: { DETECTOR: 2, KEYWORD_SCRAPER: 5, YOUTUBE_SUMMARIZER: 5, PDF_CHAT: 1 },
  IMAGE: { GENERATE: 2, ALT_TEXT: 2, ENHANCE: 5 },
  WEBSITE_RANKING: {
    ANALYSER: 3,
    PROMPT_CREATOR: 2,
    RANK_CHECKER_PER_PROMPT: 1,
    ADVANCED_ANALYSIS: 3,
    ORCHESTRATOR_BASE: 8,
  },
  COMPETITOR_LIKE_BLOG: 10,
})

// Cost Multipliers based on AI model
export const MODEL_MULTIPLIER = { OPENAI: 1.25, CHATGPT: 1.25, CLAUDE: 1.5, GEMINI: 1 }

/**
 * Converts backend (Gemini-based) credits to model-specific credits
 * @param geminiCredits Base credits for Gemini
 * @param aiModel Targeted AI model
 * @returns {number} Final credit cost
 */
export function convertGeminiToAICredits(geminiCredits: number, aiModel?: string): number {
  const model = (aiModel?.toUpperCase() || "GEMINI") as keyof typeof MODEL_MULTIPLIER
  const multiplier = MODEL_MULTIPLIER[model] ?? (MODEL_MULTIPLIER.GEMINI as number)
  return Math.ceil(geminiCredits * multiplier)
}
