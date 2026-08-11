import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  getImages,
  searchImages,
  generateImage,
  enhanceImage,
  generateAltText,
} from "@api/imageGalleryApi"

const useImageStore = create(
  devtools(
    (set, _get) => ({
      images: [],
      totalImages: 0,
      loading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Cleared on account switch — the image gallery is account-specific.
      reset: () => set({ images: [], totalImages: 0, loading: false, error: null }),

      // Async Actions
      fetchImages: async (params) => {
        set({ loading: true, error: null })
        try {
          const response = params.q ? await searchImages(params) : await getImages(params)
          set({
            images: response.data || [],
            totalImages: response.pagination?.total || 0,
            loading: false,
          })
          return response
        } catch (error) {
          const errMsg = error?.message || "Failed to load images"
          set({ error: errMsg, loading: false })
          throw error
        }
      },

      generateImage: async (genForm) => {
        const response = await generateImage(genForm)
        return response
      },

      enhanceImage: async (formData) => {
        const response = await enhanceImage(formData)
        return response
      },

      generateAltText: async (imageUrl) => {
        const response = await generateAltText({ imageUrl })
        return response
      },
    }),
    { name: "image-store" }
  )
)

export default useImageStore
