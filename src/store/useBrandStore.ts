import { getSiteInfo } from "@api/brandApi"
import { toast } from "sonner"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

/** Error shape thrown by the axios-based brand API. */
interface ApiError {
  response?: { data?: { message?: string } }
  message?: string
}

interface SiteInfoSlice {
  data: unknown | null
  loading: boolean
  error: string | null
}

interface BrandState {
  selectedVoice: unknown | null
  siteInfo: SiteInfoSlice

  setSelectedVoice: (voice: unknown | null) => void
  setSiteInfo: (updates: Partial<SiteInfoSlice>) => void
  resetSiteInfo: () => void
  reset: () => void
  fetchSiteInfo: (url: string) => Promise<unknown>
}

const useBrandStore = create<BrandState>()(
  devtools(
    (set) => ({
      selectedVoice: null,
      siteInfo: { data: null, loading: false, error: null },

      // Actions
      setSelectedVoice: (voice) => set({ selectedVoice: voice }),
      setSiteInfo: (updates) => set((state) => ({ siteInfo: { ...state.siteInfo, ...updates } })),
      resetSiteInfo: () => set({ siteInfo: { data: null, loading: false, error: null } }),

      // Cleared on account switch — the previous account's selected brand/site-info
      // must not leak into the newly active one.
      reset: () =>
        set({ selectedVoice: null, siteInfo: { data: null, loading: false, error: null } }),

      // Async Actions
      fetchSiteInfo: async (url) => {
        set((state) => ({ siteInfo: { ...state.siteInfo, loading: true, error: null } }))
        try {
          const data = await getSiteInfo(url)
          toast.success("Site info fetched successfully.")
          set((state) => ({ siteInfo: { ...state.siteInfo, data, loading: false } }))
          return data
        } catch (error) {
          const errorMsg = (error as ApiError)?.response?.data?.message || "Failed to fetch site info."
          toast.error(errorMsg)
          set((state) => ({ siteInfo: { ...state.siteInfo, loading: false, error: errorMsg } }))
          throw error
        }
      },
    }),
    { name: "brand-store" }
  )
)

export default useBrandStore
