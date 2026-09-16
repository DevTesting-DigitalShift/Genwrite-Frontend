import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { blogsQuery } from "@api/Blog/Blog.query"
import { queryClient } from "@utils/queryClient"
import type { components } from "@/types/apiSchema"
import useBlogStore from "./useBlogStore"

export type BlogInsight = NonNullable<components["schemas"]["BlogInsight"]>
export type BlogPosting = Awaited<ReturnType<typeof blogsQuery.getPostings>>[number]

interface FormData {
  category: string
  includeTableOfContents: boolean
  title: string
}

interface SeoMetadata {
  title: string
  description: string
}

interface EditorState {
  editorContent: string
  editorTitle: string
  keywords: string[]
  unsavedChanges: boolean
  formData: FormData
  /** Posting status per platform (e.g. `posted.SHOPIFY?.link`) — not a boolean, despite the old prop name. */
  posted: Record<string, any>
  isPosting: boolean
  seoMetadata: SeoMetadata
  blogPostings: BlogPosting[]
  isLoadingPostings: boolean
  insight: BlogInsight | null
  applyingSuggestionId: string | null
  availableSections: { id: string; title: string; preview: string }[]
  isRegenerateModalOpen: boolean

  setEditorContent: (content: string) => void
  setEditorTitle: (title: string) => void
  setKeywords: (keywords: string[]) => void
  setUnsavedChanges: (unsaved: boolean) => void
  setFormData: (formData: FormData | ((prev: FormData) => FormData)) => void
  setPosted: (
    posted: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)
  ) => void
  setIsPosting: (isPosting: boolean) => void
  setSeoMetadata: (metadata: SeoMetadata | ((prev: SeoMetadata) => SeoMetadata)) => void
  setAvailableSections: (sections: EditorState["availableSections"]) => void
  setIsRegenerateModalOpen: (open: boolean) => void
  setApplyingSuggestionId: (id: string | null) => void

  /** Refetches postings for the currently selected blog (`useBlogStore`'s `selectedBlog`). */
  fetchPostings: () => Promise<void>
  /**
   * Single writer for insight state — keeps the store and the `["blogInsight", blogId]`
   * query cache in step, so restoring on reload (via `useBlogInsightQuery`) and updating
   * after an analyze/apply/confirm call always agree.
   */
  persistInsight: (
    next: BlogInsight | null | ((prev: BlogInsight | null) => BlogInsight | null)
  ) => void

  reset: () => void
}

const initialFormData: FormData = { category: "", includeTableOfContents: false, title: "" }
const initialSeoMetadata: SeoMetadata = { title: "", description: "" }

/**
 * Shared state for the blog editor (`MainEditorPage.tsx`) and its sidebar
 * (`TextEditorSidebar.tsx` + `sidebars/*.tsx`) — feature-scoped like `useAiReviewStore`,
 * not a whole-app store. Replaces prop-drilling `editorContent`/`keywords`/`formData`/etc.
 * through 2-3 component layers; every panel reads what it needs directly instead.
 *
 * `blog` itself is NOT duplicated here — it already lives in `useBlogStore.selectedBlog`.
 */
const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      editorContent: "",
      editorTitle: "",
      keywords: [],
      unsavedChanges: false,
      formData: initialFormData,
      posted: {},
      isPosting: false,
      seoMetadata: initialSeoMetadata,
      blogPostings: [],
      isLoadingPostings: false,
      insight: null,
      applyingSuggestionId: null,
      availableSections: [],
      isRegenerateModalOpen: false,

      setEditorContent: (editorContent) => set({ editorContent }),
      setEditorTitle: (editorTitle) => set({ editorTitle }),
      setKeywords: (keywords) => set({ keywords }),
      setUnsavedChanges: (unsavedChanges) => set({ unsavedChanges }),
      setFormData: (formData) =>
        set((state) => ({
          formData: typeof formData === "function" ? formData(state.formData) : formData,
        })),
      setPosted: (posted) =>
        set((state) => ({ posted: typeof posted === "function" ? posted(state.posted) : posted })),
      setIsPosting: (isPosting) => set({ isPosting }),
      setSeoMetadata: (seoMetadata) =>
        set((state) => ({
          seoMetadata:
            typeof seoMetadata === "function" ? seoMetadata(state.seoMetadata) : seoMetadata,
        })),
      setAvailableSections: (availableSections) => set({ availableSections }),
      setIsRegenerateModalOpen: (isRegenerateModalOpen) => set({ isRegenerateModalOpen }),
      setApplyingSuggestionId: (applyingSuggestionId) => set({ applyingSuggestionId }),

      fetchPostings: async () => {
        const blogId = useBlogStore.getState().selectedBlog?._id
        if (!blogId) return

        set({ isLoadingPostings: true })
        try {
          const postings = await blogsQuery.getPostings(blogId)
          set({ blogPostings: postings })
        } catch (error) {
          console.error("Failed to fetch blog postings:", error)
        } finally {
          set({ isLoadingPostings: false })
        }
      },

      persistInsight: (next) => {
        const value = typeof next === "function" ? next(get().insight) : next
        set({ insight: value })
        const blogId = useBlogStore.getState().selectedBlog?._id
        if (blogId) queryClient.setQueryData(["blogInsight", blogId], value)
      },

      // Cleared on blog switch / account switch.
      reset: () =>
        set({
          editorContent: "",
          editorTitle: "",
          keywords: [],
          unsavedChanges: false,
          formData: initialFormData,
          posted: {},
          isPosting: false,
          seoMetadata: initialSeoMetadata,
          blogPostings: [],
          isLoadingPostings: false,
          insight: null,
          applyingSuggestionId: null,
          availableSections: [],
          isRegenerateModalOpen: false,
        }),
    }),
    { name: "editor-store" }
  )
)

export default useEditorStore
