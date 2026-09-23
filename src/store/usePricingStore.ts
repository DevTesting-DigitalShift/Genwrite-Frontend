import { create } from "zustand"
import { PricingAPI, type PricingCatalogue } from "@api/Pricing/Pricing.api"
import { PRICING_FALLBACK } from "@/data/pricingFallback"

interface PricingState {
  /** The backend's credit-cost catalogue — PRICING_FALLBACK until `load()` resolves. */
  catalogue: PricingCatalogue
  /** True once the live catalogue has replaced the fallback. */
  isLive: boolean
  /** Fetches GET /user/pricing once per session; later calls reuse the in-flight/done request. */
  load: () => Promise<void>
}

let inFlight: Promise<void> | null = null

/**
 * Single source of credit costs for the whole app — every "N credits" label and pre-flight
 * credit check reads from here (via useCosts/getCosts in @/data/costs, computeCost in
 * @/data/pricingConfig, or the media model catalogue), so a price change in the backend's
 * `<module>.pricing.js` files shows up without a frontend deploy. Loaded from
 * PrivateRoutesLayout on sign-in.
 */
const usePricingStore = create<PricingState>()((set) => ({
  catalogue: PRICING_FALLBACK,
  isLive: false,
  load: () => {
    inFlight ??= PricingAPI.getCatalogue()
      .then((catalogue) => set({ catalogue, isLive: true }))
      .catch((err) => {
        // Keep the fallback — labels stay usable, and the backend still charges its real price.
        console.warn("Pricing catalogue failed to load, using fallback:", err)
        inFlight = null // allow a retry on the next load() call
      })
    return inFlight
  },
}))

export default usePricingStore
