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
    (set, get) => ({
      images: [],
      totalImages: 0,
      loading: false,
      error: null,

      // Actions
      setLoading: loading => set({ loading }),
      setError: error => set({ error }),

      // Async Actions
      fetchImages: async params => {
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

      generateImage: async genForm => {
        try {
          const response = await generateImage(genForm)
          return response
        } catch (error) {
          throw error
        }
      },

      enhanceImage: async formData => {
        try {
          const response = await enhanceImage(formData)
          return response
        } catch (error) {
          throw error
        }
      },

      generateAltText: async imageUrl => {
        try {
          const response = await generateAltText({ imageUrl })
          return response
        } catch (error) {
          throw error
        }
      },
    }),
    { name: "image-store" }
  )
)

export default useImageStore
