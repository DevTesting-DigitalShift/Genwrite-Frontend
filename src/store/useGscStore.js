import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { getVerifiedSites, getGscAnalytics, connectGsc, getGscAuthUrl } from "@/api/gscApi"

const useGscStore = create(
  devtools(
    set => ({
      verifiedSites: [],
      analyticsData: [],
      gscAuthUrl: null,
      loading: false,
      error: null,

      // Actions
      clearAnalytics: () => set({ analyticsData: [] }),
      setLoading: loading => set({ loading }),
      setError: error => set({ error }),

      // Async Actions
      fetchVerifiedSites: async () => {
        set({ loading: true, error: null })
        try {
          const data = await getVerifiedSites()
          set({ verifiedSites: data || [], loading: false })
          return data
        } catch (error) {
          const errMsg = error?.message || error?.response?.data || "Failed to fetch verified sites"
          set({ error: errMsg, loading: false })
          throw error
        }
      },

      fetchGscAnalytics: async params => {
        set({ loading: true, error: null })
        try {
          const data = await getGscAnalytics(params)
          set({ analyticsData: data || [], loading: false })
          return data
        } catch (error) {
          const errMsg = error?.message || error?.response?.data || "Failed to fetch GSC analytics"
          set({ error: errMsg, loading: false })
          throw error
        }
      },

      connectGscAccount: async ({ code, state }) => {
        set({ loading: true, error: null })
        try {
          const data = await connectGsc({ code, state })
          set({ loading: false })
          return data
        } catch (error) {
          const errMsg = error?.message || error?.response?.data || "Failed to connect GSC"
          set({ error: errMsg, loading: false })
          throw error
        }
      },

      fetchGscAuthUrl: async () => {
        set({ loading: true, error: null })
        try {
          const url = await getGscAuthUrl()
          set({ gscAuthUrl: url, loading: false })
          return url
        } catch (error) {
          const errMsg = error?.message || error?.response?.data || "Failed to get auth URL"
          set({ error: errMsg, loading: false })
          throw error
        }
      },
    }),
    { name: "gsc-store" }
  )
)

export default useGscStore
