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
]

export const AI_MODELS = [
  {
    id: "gemini",
    label: "Gemini",
    logo: "/Images/gemini.png",
  },
  {
    id: "openai",
    label: "ChatGPT",
    logo: "/Images/chatgpt.png",
  },
  {
    id: "claude",
    label: "Claude",
    logo: "/Images/claude.png",
  },
]

export const IMAGE_OPTIONS = [
  {
    id: IMAGE_SOURCE.STOCK,
    label: "Stock Images",
    restrict: false,
  },
  {
    id: IMAGE_SOURCE.AI,
    label: "AI-Generated Images",
    restrict: true,
  },
  {
    id: IMAGE_SOURCE.UPLOAD,
    label: "Upload Images",
    restrict: true,
  },
]
