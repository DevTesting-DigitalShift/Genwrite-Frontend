// Pricing configuration for the PricingCalculator
// All costs are in credits
export const pricingConfig = {
  wordCount: {
    base: 100, // words per unit
    cost: 5, // credits per base
  },
  features: {
    brandVoice: { label: "Brand Voice", cost: 10 },
    competitorResearch: { label: "Competitor Research", cost: 10 },
    keywordResearch: { label: "Keyword Research", cost: 10 },
    internalLinking: { label: "Internal Linking", cost: 10 },
    faqGeneration: { label: "FAQ Generation", cost: 10 },
    automaticPosting: { label: "Automatic Posting", cost: 10 },
  },
  images: {
    stock: { featureFee: 10 },
    ai: { featureFee: 20 },
    upload: { perImageFee: 5 },
  },
  aiModels: {
    gemini: { label: "Gemini", costMultiplier: 1 },
    chatgpt: { label: "ChatGPT", costMultiplier: 2 },
    claude: { label: "Claude", costMultiplier: 2.5 },
  },
}

// Once one step has been run there will be no credits refunded for that step even in failure
