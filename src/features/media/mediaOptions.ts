import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

export type MediaModel = PricingCatalogue["media"][string] & { id: string }
