// src/api/Pricing/Pricing.api.ts
import { apiGet, apiPost, rethrow } from "@api/typedClient"
import type { Schema } from "@/types/apiHelpers"

/** Every module's credit costs, keyed by backend module — GET /user/pricing's `catalogue`. */
export type PricingCatalogue = Schema<"PricingCatalogue">

export type UgcAdQuoteParams = {
  videoModel: string
  resolution: string | null
  productImages: number
  subtitles: boolean
  structure?: { kind: UgcSceneKind; durationSeconds: number }[]
  script?: string
  pacing: "natural" | "as_written"
}

export type UgcSceneKind = "hook" | "demo" | "cta" | "talk"

/** What POST /user/pricing/calculate returns for a multi-scene ad: the exact charge plus the
 * scenes it will have (a pasted script's scenes may be lengthened to fit the speech). */
export type UgcAdQuote = {
  cost: number
  breakdown?: {
    scenes: { index: number; kind: UgcSceneKind; title: string | null; durationSeconds: number }[]
    warnings: string[]
    demoVideoModel: string
  }
}

export const PricingAPI = {
  /** Exact price of a multi-scene UGC ad — the same preparation the backend charges from. */
  quoteUgcAd: async (params: UgcAdQuoteParams): Promise<UgcAdQuote> => {
    try {
      const res = await apiPost("/user/pricing/calculate", {
        type: "media-ugc-ad",
        params,
      } as never)
      return (res as { data: UgcAdQuote }).data
    } catch (err) {
      return rethrow(err, "Failed to price the ad")
    }
  },

  /** The whole catalogue in one call — small, static per deploy, so it's loaded once per
   * session by usePricingStore rather than per module. */
  getCatalogue: async (): Promise<PricingCatalogue> => {
    try {
      const { data } = await apiGet("/user/pricing")
      if (!("catalogue" in data)) throw new Error("Unexpected pricing response")
      return data.catalogue
    } catch (err) {
      return rethrow(err, "Failed to load pricing")
    }
  },
}
