import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  fetchIntegrations as fetchIntegrationsAPI,
  fetchCategories as fetchCategoriesAPI,
  pingIntegration as pingIntegrationAPI,
  createIntegration as createIntegrationAPI,
  updateIntegration as updateIntegrationAPI,
} from "@api/otherApi"

const useIntegrationStore = create(
  devtools(
    set => ({
      integrations: [],
      categories: [],
      loading: false,
      error: null,
      ping: null,

      // Actions
      setIntegrations: integrations => set({ integrations }),
      setCategories: categories => set({ categories }),
      setLoading: loading => set({ loading }),
      setError: error => set({ error }),

      // Async Actions
      fetchIntegrations: async () => {
        set({ loading: true, error: null })
        try {
          const data = await fetchIntegrationsAPI()
          set({ integrations: data, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchCategories: async (type = "WORDPRESS") => {
        set({ loading: true, error: null })
        try {
          const data = await fetchCategoriesAPI(type)
          set({ categories: data, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      pingIntegration: async type => {
        set({ loading: true, error: null })
        try {
          const data = await pingIntegrationAPI(type)
          set({ ping: data, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      createIntegration: async payload => {
        set({ loading: true, error: null })
        try {
          const data = await createIntegrationAPI(payload)
          set({ loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      updateIntegration: async payload => {
        set({ loading: true, error: null })
        try {
          const data = await updateIntegrationAPI(payload)
          set({ loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      resetCategories: () => set({ categories: [], error: null }),
    }),
    { name: "integration-store" }
  )
)

export default useIntegrationStore
