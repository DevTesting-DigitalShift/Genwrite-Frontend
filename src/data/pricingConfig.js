// Pricing configuration for the PricingCalculator
// All costs are in credits
export const pricingConfig = {
  wordCount: {
    base: 500, // words per unit
    cost: 5, // credits per base
  },
  features: {
    brandVoice: { label: "Brand Voice", cost: 5 },
    competitorResearch: { label: "Competitor Research", cost: 5 },
    keywordResearch: { label: "Keyword Research", cost: 5 },
    internalLinking: { label: "Internal Linking", cost: 5 },
    faqGeneration: { label: "FAQ Generation", cost: 5 },
    automaticPosting: { label: "Automatic Posting", cost: 5 },
  },
  images: {
    stock: { featureFee: 5 },
    ai: { featureFee: 10 },
    upload: { perImageFee: 5 },
  },
  aiModels: {
    gemini: { label: "Gemini", cost: 10 },
    chatgpt: { label: "ChatGPT", cost: 20 },
    claude: { label: "Claude", cost: 30 },
  },
}
