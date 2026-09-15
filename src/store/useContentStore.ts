import { fetchCategories } from "@api/integrationApi"
import { apiErrorMessage } from "@/types/api"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

/**
 * WordPress/integration posting-category state only. AI generation results
 * (outline/metadata/prompt-content) live in each caller's own generateQuery mutation
 * instead of here — a single shared `data` field for all three meant one page's result
 * could leak into another's (e.g. an outline showing up as "generated content" on
 * PromptContent after navigating there), and the store duplicated what the mutation's
 * own .data/.reset() already provide for free.
 */
interface ContentState {
  categories: any[]
  loading: boolean
  error: string | null

  resetCategories: () => void
  reset: () => void

  fetchCategories: (type?: string) => Promise<unknown>
}

const useContentStore = create<ContentState>()(
  devtools(
    (set) => ({
      categories: [],
      loading: false,
      error: null,

      // Actions
      resetCategories: () => set({ categories: [], error: null }),

      // Cleared on account switch.
      reset: () => set({ categories: [], loading: false, error: null }),

      // Async Actions
      fetchCategories: async (type = "WORDPRESS") => {
        set({ loading: true, error: null })
        try {
          const data = await fetchCategories(type)
          set({ categories: data, loading: false })
          return data
        } catch (err) {
          set({ error: apiErrorMessage(err, "Failed to fetch categories"), loading: false })
          throw err
        }
      },
    }),
    { name: "content-store" }
  )
)

export default useContentStore
