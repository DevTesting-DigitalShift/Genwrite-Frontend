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

/** One selectable image source shown by ImageSourceSelector. */
export interface ImageOption {
  id: string
  label: string
  description: string
  restrictedPlans: string[]
}

export const IMAGE_OPTIONS: ImageOption[] = [
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

// Credit costs live in the backend's pricing catalogue — use useCosts()/getCosts() from
// @/data/costs (or computeCost from @/data/pricingConfig for blog generation).
