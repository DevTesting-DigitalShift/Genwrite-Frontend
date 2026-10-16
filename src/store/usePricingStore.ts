import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { PricingAPI, type PricingCatalogue } from "@api/Pricing/Pricing.api"
import { PRICING_FALLBACK } from "@/data/pricingFallback"

/** How long a cached catalogue may stand in for the live one before it's treated as missing. */
export const PRICING_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

/**
 * - `loading`: no usable catalogue yet (first visit, or the cache expired) — fal model prices
 *   are not shown, since there is nothing real to show.
 * - `ready`: a catalogue is in hand, either the live one or the last good one from the cache.
 * - `error`: the fetch failed and there is no usable cache.
 */
export type PricingStatus = "loading" | "ready" | "error"

interface PricingState {
  /** The backend's credit-cost catalogue. Its `media` block is empty until a live or cached
   * catalogue arrives — the fal model list and prices exist only on the backend. */
  catalogue: PricingCatalogue
  status: PricingStatus
  /** True once the live catalogue has replaced any cached one. */
  isLive: boolean
  /** When the catalogue in hand was fetched, for the cache's expiry. */
  fetchedAt: number | null
  /** Fetches GET /user/pricing once per session; later calls reuse the in-flight/done request.
   * After a failure the next call retries. */
  load: () => Promise<void>
}

let inFlight: Promise<void> | null = null

/**
 * Single source of credit costs for the whole app — every "N credits" label and pre-flight
 * credit check reads from here (via useCosts/getCosts in @/data/costs, computeCost in
 * @/data/pricingConfig, or the media model catalogue), so a price change in the backend's
 * `<module>.pricing.js` files shows up without a frontend deploy. Loaded from
 * PrivateRoutesLayout on sign-in.
 *
 * The last good catalogue is kept in localStorage (stale-while-revalidate): a returning user
 * sees real prices straight away and the live fetch refreshes them. The static
 * PRICING_FALLBACK only covers the non-media modules' labels; it deliberately has no fal
 * models, so a model's price is never a guess.
 */
const usePricingStore = create<PricingState>()(
  persist(
    (set, get) => ({
      catalogue: PRICING_FALLBACK,
      status: "loading",
      isLive: false,
      fetchedAt: null,
      load: () => {
        inFlight ??= (async () => {
          try {
            const catalogue = await PricingAPI.getCatalogue()
            set({ catalogue, status: "ready", isLive: true, fetchedAt: Date.now() })
          } catch (err) {
            console.warn("Pricing catalogue failed to load:", err)
            // A cached catalogue keeps serving; with none, say so rather than invent prices.
            if (get().status !== "ready") set({ status: "error" })
            inFlight = null // allow a retry on the next load() call
          }
        })()
        return inFlight
      },
    }),
    {
      name: "pricing-catalogue",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the data is cached — never the loading/error flags.
      partialize: (state) => ({ catalogue: state.catalogue, fetchedAt: state.fetchedAt }),
      merge: (persisted, current) => {
        const cached = persisted as
          | Partial<Pick<PricingState, "catalogue" | "fetchedAt">>
          | undefined
        const fresh =
          cached?.catalogue &&
          cached.fetchedAt &&
          Date.now() - cached.fetchedAt < PRICING_CACHE_MAX_AGE_MS
        return fresh
          ? {
              ...current,
              catalogue: cached.catalogue as PricingCatalogue,
              fetchedAt: cached.fetchedAt ?? null,
              status: "ready",
            }
          : current
      },
    }
  )
)

/** What a media screen needs: the model catalogue, and whether it can be trusted yet. */
export const useMediaPricing = () => {
  const media = usePricingStore((s) => s.catalogue.media)
  const status = usePricingStore((s) => s.status)
  const load = usePricingStore((s) => s.load)
  return {
    media,
    ready: status === "ready" && Object.keys(media).length > 0,
    failed: status === "error",
    retry: load,
  }
}

export default usePricingStore
