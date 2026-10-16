// src/api/Pricing/Pricing.api.ts
import { apiGet, rethrow } from "@api/typedClient"
import type { Schema } from "@/types/apiHelpers"

/** Every module's credit costs, keyed by backend module — GET /user/pricing's `catalogue`. */
export type PricingCatalogue = Schema<"PricingCatalogue">

export const PricingAPI = {
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
