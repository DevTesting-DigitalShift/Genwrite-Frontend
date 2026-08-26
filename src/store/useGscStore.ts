import { connectGsc, getGscAnalytics, getGscAuthUrl, getVerifiedSites } from "@/api/gscApi"
import { apiErrorMessage } from "@/types/api"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface GscState {
  verifiedSites: unknown[]
  analyticsData: unknown[]
  gscAuthUrl: string | null
  loading: boolean
  error: string | null

  clearAnalytics: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  fetchVerifiedSites: () => Promise<unknown>
  fetchGscAnalytics: (params: Record<string, unknown>) => Promise<unknown>
  connectGscAccount: (args: { code: string; state?: string }) => Promise<unknown>
  fetchGscAuthUrl: () => Promise<unknown>
}

const useGscStore = create<GscState>()(
  devtools(
    (set) => ({
      verifiedSites: [],
      analyticsData: [],
      gscAuthUrl: null,
      loading: false,
      error: null,

      // Actions
      clearAnalytics: () => set({ analyticsData: [] }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Cleared on account switch — GSC data is account-specific.
      reset: () =>
        set({
          verifiedSites: [],
          analyticsData: [],
          gscAuthUrl: null,
          loading: false,
          error: null,
        }),

      // Async Actions
      fetchVerifiedSites: async () => {
        set({ loading: true, error: null })
        try {
          const data = await getVerifiedSites()
          set({ verifiedSites: data || [], loading: false })
          return data
        } catch (error) {
          set({ error: apiErrorMessage(error, "Failed to fetch verified sites"), loading: false })
          throw error
        }
      },

      fetchGscAnalytics: async (params) => {
        set({ loading: true, error: null })
        try {
          const data = await getGscAnalytics(params)
          set({ analyticsData: data || [], loading: false })
          return data
        } catch (error) {
          set({ error: apiErrorMessage(error, "Failed to fetch GSC analytics"), loading: false })
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
          set({ error: apiErrorMessage(error, "Failed to connect GSC"), loading: false })
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
          set({ error: apiErrorMessage(error, "Failed to get auth URL"), loading: false })
          throw error
        }
      },
    }),
    { name: "gsc-store" }
  )
)

export default useGscStore
