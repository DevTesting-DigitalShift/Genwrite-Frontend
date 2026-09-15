import { create } from "zustand"
import { devtools } from "zustand/middleware"

/**
 * The API returns `{ integrations: { [type]: config } }`, but the store is seeded with
 * `[]` before the first load — so consumers reach through `.integrations`.
 */
export interface IntegrationsPayload {
  integrations?: Record<string, unknown>
  [key: string]: any
}

/**
 * Pure client-state mirror of the integrations list — a shared cache multiple independent
 * components (TextEditorSidebar, PluginsMain, AdvancedBlogModal, BulkBlogModal) populate via
 * integrationQuery.useList() so that passive readers (RegenerateModal, PostingPanel) don't
 * each need to fetch it themselves. No API calls happen here — every fetch/create/ping goes
 * through integrationQuery (Integration.query.ts), which then calls setIntegrations.
 */
interface IntegrationState {
  integrations: IntegrationsPayload
  categories: any[]
  loading: boolean
  error: string | null
  ping: any | null

  setIntegrations: (integrations: IntegrationsPayload) => void
  setCategories: (categories: any[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPing: (ping: unknown) => void
  resetCategories: () => void
  reset: () => void
}

const useIntegrationStore = create<IntegrationState>()(
  devtools(
    (set) => ({
      integrations: [] as unknown as IntegrationsPayload,
      categories: [],
      loading: false,
      error: null,
      ping: null,

      setIntegrations: (integrations) => set({ integrations }),
      setCategories: (categories) => set({ categories }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setPing: (ping) => set({ ping }),
      resetCategories: () => set({ categories: [], error: null }),

      // Cleared on account switch.
      reset: () =>
        set({
          integrations: [] as unknown as IntegrationsPayload,
          categories: [],
          loading: false,
          error: null,
          ping: null,
        }),
    }),
    { name: "integration-store" }
  )
)

export default useIntegrationStore
