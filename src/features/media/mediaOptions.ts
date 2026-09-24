import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

export type MediaModel = PricingCatalogue["media"][string] & { id: string }

export const PURPOSES = [
  { id: "poster", label: "Poster" },
  { id: "thumbnail", label: "Thumbnail" },
  { id: "reel", label: "Reel" },
  { id: "social_post", label: "Social post" },
  { id: "other", label: "Other" },
] as const

export type Purpose = (typeof PURPOSES)[number]["id"]
