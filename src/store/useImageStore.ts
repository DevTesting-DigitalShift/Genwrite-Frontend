import {
  enhanceImage,
  generateAltText,
  generateImage,
  getImages,
  searchImages,
} from "@api/imageGalleryApi"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

/** One image row from the gallery API. */
export interface GalleryImage {
  _id?: string
  url?: string
  [key: string]: unknown
}

export interface ImageQueryParams extends Record<string, unknown> {
  q?: string
  page?: number
  limit?: number
  tags?: string[]
  minScore?: number
}

interface ImageListResponse {
  data?: GalleryImage[]
  pagination?: { total?: number }
}

interface ImageState {
  images: GalleryImage[]
  totalImages: number
  loading: boolean
  error: string | null

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  fetchImages: (params: ImageQueryParams) => Promise<ImageListResponse>
  generateImage: (genForm: object) => Promise<unknown>
  enhanceImage: (formData: FormData) => Promise<unknown>
  generateAltText: (imageUrl: string) => Promise<unknown>
}

const useImageStore = create<ImageState>()(
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
          const response: ImageListResponse = params.q
            ? await searchImages(params)
            : await getImages(params)
          set({
            images: response.data || [],
            totalImages: response.pagination?.total || 0,
            loading: false,
          })
          return response
        } catch (error) {
          const errMsg = (error as Error)?.message || "Failed to load images"
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
