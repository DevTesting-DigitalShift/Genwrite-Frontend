import { apiErrorMessage } from "@/types/api"
import {
  createIntegration as createIntegrationAPI,
  fetchCategories as fetchCategoriesAPI,
  fetchIntegrations as fetchIntegrationsAPI,
  pingIntegration as pingIntegrationAPI,
  updateIntegration as updateIntegrationAPI,
} from "@api/otherApi"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

/**
 * The API returns `{ integrations: { [type]: config } }`, but the store is seeded with
 * `[]` before the first load — so consumers reach through `.integrations`.
 */
export interface IntegrationsPayload {
  integrations?: Record<string, unknown>
  [key: string]: unknown
}

interface IntegrationState {
  integrations: IntegrationsPayload
  categories: unknown[]
  loading: boolean
  error: string | null
  ping: unknown | null

  setIntegrations: (integrations: IntegrationsPayload) => void
  setCategories: (categories: unknown[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  fetchIntegrations: () => Promise<unknown>
  fetchCategories: (type?: string) => Promise<unknown>
  pingIntegration: (type: string) => Promise<unknown>
  createIntegration: (payload: unknown) => Promise<unknown>
  updateIntegration: (payload: unknown) => Promise<unknown>
  resetCategories: () => void
}

const useIntegrationStore = create<IntegrationState>()(
  devtools(
    (set) => ({
      integrations: [] as unknown as IntegrationsPayload,
      categories: [],
      loading: false,
      error: null,
      ping: null,

      // Actions
      setIntegrations: (integrations) => set({ integrations }),
      setCategories: (categories) => set({ categories }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Async Actions
      fetchIntegrations: async () => {
        set({ loading: true, error: null })
        try {
          const data = await fetchIntegrationsAPI()
          set({ integrations: data, loading: false })
          return data
        } catch (error) {
          set({ error: apiErrorMessage(error, "Failed to fetch integrations"), loading: false })
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
          set({ error: apiErrorMessage(error, "Failed to fetch categories"), loading: false })
          throw error
        }
      },

      pingIntegration: async (type) => {
        set({ loading: true, error: null })
        try {
          const data = await pingIntegrationAPI(type)
          set({ ping: data, loading: false })
          return data
        } catch (error) {
          set({ error: apiErrorMessage(error, "Failed to ping integration"), loading: false })
          throw error
        }
      },

      createIntegration: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await createIntegrationAPI(payload)
          set({ loading: false })
          return data
        } catch (error) {
          set({ error: apiErrorMessage(error, "Failed to create integration"), loading: false })
          throw error
        }
      },

      updateIntegration: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await updateIntegrationAPI(payload)
          set({ loading: false })
          return data
        } catch (error) {
          set({ error: apiErrorMessage(error, "Failed to update integration"), loading: false })
          throw error
        }
      },

      resetCategories: () => set({ categories: [], error: null }),
    }),
    { name: "integration-store" }
  )
)

export default useIntegrationStore
