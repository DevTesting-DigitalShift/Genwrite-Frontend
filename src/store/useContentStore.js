import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  createOutline,
  generateMetadata,
  generatePromptContent,
  fetchCategories,
} from "@api/otherApi"
import { toast } from "sonner"

const useContentStore = create(
  devtools(
    set => ({
      data: null,
      metadata: null,
      categories: [],
      loading: false,
      error: null,

      // Actions
      resetMetadata: () => set({ metadata: null }),
      clearContentData: () => set({ data: null }),
      resetCategories: () => set({ categories: [], error: null }),

      // Async Actions
      fetchCategories: async (type = "WORDPRESS") => {
        set({ loading: true, error: null })
        try {
          const data = await fetchCategories(type)
          set({ categories: data, loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      createOutline: async payload => {
        set({ loading: true, error: null })
        try {
          const data = await createOutline(payload)
          set({ data, loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          toast.error("Failed to create outline")
          set({ error: errorMsg, loading: false })
          throw err
        }
      },

      generateMetadata: async payload => {
        set({ loading: true, error: null })
        try {
          const data = await generateMetadata(payload)
          set({ metadata: data, loading: false })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message
          toast.error("Failed to generate metadata")
          set({ error: errorMsg, loading: false })
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
          const errorMsg = err.response?.data?.message || err.message
          toast.error("Failed to generate content")
          set({ error: errorMsg, loading: false })
          throw err
        }
      },
    }),
    { name: "content-store" }
  )
)

export default useContentStore
