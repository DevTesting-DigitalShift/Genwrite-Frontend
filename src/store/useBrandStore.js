import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { getSiteInfo } from "@api/brandApi"
import toast from "@utils/toast"

const useBrandStore = create(
  devtools(
    set => ({
      selectedVoice: null,
      siteInfo: { data: null, loading: false, error: null },

      // Actions
      setSelectedVoice: voice => set({ selectedVoice: voice }),
      setSiteInfo: updates => set(state => ({ siteInfo: { ...state.siteInfo, ...updates } })),
      resetSiteInfo: () => set({ siteInfo: { data: null, loading: false, error: null } }),

      // Async Actions
      fetchSiteInfo: async url => {
        set(state => ({ siteInfo: { ...state.siteInfo, loading: true, error: null } }))
        try {
          const data = await getSiteInfo(url)
          toast.success("Site info fetched successfully.")
          set(state => ({ siteInfo: { ...state.siteInfo, data, loading: false } }))
          return data
        } catch (error) {
          const errorMsg = error?.response?.data?.message || "Failed to fetch site info."
          toast.error(errorMsg)
          set(state => ({ siteInfo: { ...state.siteInfo, loading: false, error: errorMsg } }))
          throw error
        }
      },
    }),
    { name: "brand-store" }
  )
)

export default useBrandStore
