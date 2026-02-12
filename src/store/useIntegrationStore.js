import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  fetchIntegrations,
  pingIntegration,
  createIntegration,
  fetchCategories as fetchOtherCategories,
} from "@api/otherApi"
import { getCategories, updateIntegration, getIntegrationById } from "@/api/integrationApi"
import { getVerifiedSites, getGscAnalytics, connectGsc, getGscAuthUrl } from "@/api/gscApi"
import { message } from "antd"

const useIntegrationStore = create(
  devtools(
    (set, get) => ({
      integrations: [],
      categories: [],
      currentIntegration: null,
      ping: null,
      loading: false,
      error: null,

      // GSC Specific
      verifiedSites: [],
      analyticsData: [],
      gscAuthUrl: null,

      // Actions
      setIntegrations: data => set({ integrations: data }),
      setCurrentIntegration: data => set({ currentIntegration: data }),
      setCategories: data => set({ categories: data }),
      clearAnalytics: () => set({ analyticsData: [] }),

      // Async Actions - Integrations
      fetchIntegrations: async () => {
        set({ loading: true, error: null })
        try {
          const data = await fetchIntegrations()
          set({ integrations: data, loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      pingIntegration: async type => {
        set({ loading: true, error: null })
        try {
          const data = await pingIntegration(type)
          set({ ping: data, loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      createIntegration: async payload => {
        set({ loading: true, error: null })
        try {
          const data = await createIntegration(payload)
          const currentIntegrations = get().integrations
          // Update integrations list if needed
          set({ loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      updateIntegration: async payload => {
        set({ loading: true, error: null })
        try {
          const data = await updateIntegration(payload)
          set({ loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      fetchCategories: async (type = "WORDPRESS") => {
        set({ loading: true, error: null })
        try {
          const data =
            type === "WORDPRESS" ? await fetchOtherCategories(type) : await getCategories()
          set({ categories: data, loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      // Async Actions - GSC
      fetchVerifiedSites: async () => {
        set({ loading: true, error: null })
        try {
          const data = await getVerifiedSites()
          set({ verifiedSites: data || [], loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      fetchGscAnalytics: async params => {
        set({ loading: true, error: null })
        try {
          const data = await getGscAnalytics(params)
          set({ analyticsData: data || [], loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      fetchGscAuthUrl: async () => {
        set({ loading: true, error: null })
        try {
          const url = await getGscAuthUrl()
          set({ gscAuthUrl: url, loading: false })
          return url
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      connectGscAccount: async ({ code, state }) => {
        set({ loading: true, error: null })
        try {
          const data = await connectGsc({ code, state })
          set({ loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },
    }),
    { name: "integration-store" }
  )
)

export default useIntegrationStore
