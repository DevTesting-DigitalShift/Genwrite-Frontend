import { create } from "zustand"
import { devtools } from "zustand/middleware"

/** One image row from the gallery API. */
export interface GalleryImage {
  _id?: string
  url?: string
  description?: string
  [key: string]: any
}

export interface ImageQueryParams extends Record<string, unknown> {
  q?: string
  page?: number
  limit?: number
  tags?: string[]
  minScore?: number
}

/**
 * Pure client-state mirror of the last-fetched image page. All fetching/generation/
 * enhancement goes through imageGalleryQuery (ImageGallery.query.ts) — callers write the
 * result here via setImages/setTotalImages themselves, same split as useIntegrationStore.
 */
interface ImageState {
  images: GalleryImage[]
  totalImages: number
  loading: boolean
  error: string | null

  setImages: (images: GalleryImage[]) => void
  setTotalImages: (total: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const useImageStore = create<ImageState>()(
  devtools(
    (set) => ({
      images: [],
      totalImages: 0,
      loading: false,
      error: null,

      setImages: (images) => set({ images }),
      setTotalImages: (totalImages) => set({ totalImages }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Cleared on account switch — the image gallery is account-specific.
      reset: () => set({ images: [], totalImages: 0, loading: false, error: null }),
    }),
    { name: "image-store" }
  )
)

export default useImageStore
