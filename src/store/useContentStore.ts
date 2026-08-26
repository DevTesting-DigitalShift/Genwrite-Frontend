import {
  createOutline,
  fetchCategories,
  generateMetadata,
  generatePromptContent,
} from "@api/otherApi"
import { apiErrorMessage } from "@/types/api"
import { toast } from "sonner"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface ContentState {
  data: unknown | null
  metadata: unknown | null
  categories: unknown[]
  loading: boolean
  error: string | null

  resetMetadata: () => void
  clearContentData: () => void
  resetCategories: () => void
  reset: () => void

  fetchCategories: (type?: string) => Promise<unknown>
  createOutline: (payload: unknown) => Promise<unknown>
  generateMetadata: (payload: unknown) => Promise<unknown>
  generatePromptContent: (args: { prompt: string; content?: string }) => Promise<unknown>
}

const useContentStore = create<ContentState>()(
  devtools(
    (set) => ({
      data: null,
      metadata: null,
      categories: [],
      loading: false,
      error: null,

      // Actions
      resetMetadata: () => set({ metadata: null }),
      clearContentData: () => set({ data: null }),
      resetCategories: () => set({ categories: [], error: null }),

      // Cleared on account switch.
      reset: () => set({ data: null, metadata: null, categories: [], loading: false, error: null }),

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

      createOutline: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await createOutline(payload)
          set({ data, loading: false })
          return data
        } catch (err) {
          toast.error("Failed to create outline")
          set({ error: apiErrorMessage(err, "Failed to create outline"), loading: false })
          throw err
        }
      },

      generateMetadata: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await generateMetadata(payload)
          set({ metadata: data, loading: false })
          return data
        } catch (err) {
          toast.error("Failed to generate metadata")
          set({ error: apiErrorMessage(err, "Failed to generate metadata"), loading: false })
          throw err
        }
      },

      generatePromptContent: async ({ prompt, content }) => {
        set({ loading: true, error: null })
        try {
          const data = await generatePromptContent({ prompt, content })
          set({ data, loading: false })
          return data
        } catch (err) {
          toast.error("Failed to generate content")
          set({ error: apiErrorMessage(err, "Failed to generate content"), loading: false })
          throw err
        }
      },
    }),
    { name: "content-store" }
  )
)

export default useContentStore
