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
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.webp" },
  { id: "openai", label: "ChatGPT", logo: "/Images/chatgpt.webp" },
  { id: "claude", label: "Claude", logo: "/Images/claude.webp" },
]

export const IMAGE_OPTIONS = [
  { id: IMAGE_SOURCE.STOCK, label: "Stock Images", restrict: false },
  { id: IMAGE_SOURCE.AI, label: "AI-Generated Images", restrict: true },
  { id: IMAGE_SOURCE.UPLOAD, label: "Upload Images", restrict: true },
]

// Credit Costs for AI Operations
// Credit Costs for AI Operations (Synced with Backend)
export const COSTS = {
  GENERATE: 2, // Image Generation
  ENHANCE: 5, // Image Enhancement
  ALT_TEXT: 2,
  REWRITE: 3,
  PROOFREAD: 5,
  ANALYSIS: 10,
  METADATA: 5,
  DETECTOR: 2,
  KEYWORD_SCRAPER: 5,
  YOUTUBE_SUMMARIZER: 5,
  OUTLINE: 10,
  HUMANISED_CONTENT: 5,
  PROMPT_CONTENT: 5,
  CHAT_WITH_PDF: 1,
  COMPETITOR_LIKE_BLOG: 10,
  WEBSITE_RANKING: {
    ANALYSER: 3,
    PROMPT_CREATOR: 2,
    RANK_CHECKER_PER_PROMPT: 1,
    ADVANCED_ANALYSIS: 3,
    ORCHESTRATOR_BASE: 8,
  },
}
