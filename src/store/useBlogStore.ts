import type { QueryClient } from "@tanstack/react-query"
import { createBlog, createBlogMultiple, createQuickBlog, createTopicOnlyBlog } from "@api/blogApi"
import { pushBlogCreationEvent } from "@utils/creationEvents"
import { toast } from "sonner"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

/** A blog document as returned by the blogs API. */
export interface Blog {
  _id?: string
  title?: string
  [key: string]: any
}

type NavigateFn = (path: string) => void

/** Shared arguments for every blog-creation action. */
interface CreateBlogArgs {
  blogData: Record<string, unknown>
  navigate: NavigateFn
  queryClient: QueryClient
}

interface BlogState {
  selectedBlog: Blog | null
  proofreadingSuggestions: any[]
  isAnalyzingProofreading: boolean
  generatedTitles: any[]
  /** Keyed by blog id. */
  blogPrompts: Record<string, string>

  setSelectedBlog: (blog: Blog | null) => void
  clearSelectedBlog: () => void
  setProofreadingSuggestions: (suggestions: any[]) => void
  clearProofreadingSuggestions: () => void
  setIsAnalyzingProofreading: (isAnalyzing: boolean) => void
  setGeneratedTitles: (titles: any[]) => void
  setBlogPrompt: (id: string, prompt: string) => void
  reset: () => void

  createNewBlog: (args: CreateBlogArgs) => Promise<void>
  createMultiBlog: (args: CreateBlogArgs) => Promise<void>
  createNewQuickBlog: (args: CreateBlogArgs & { type?: string }) => Promise<void>
  createTopicBlog: (args: {
    topic: string
    navigate: NavigateFn
    queryClient: QueryClient
  }) => Promise<Blog>
}

const useBlogStore = create<BlogState>()(
  devtools(
    (set) => ({
      selectedBlog: null,
      proofreadingSuggestions: [],
      isAnalyzingProofreading: false,
      generatedTitles: [],
      blogPrompts: {},

      // Actions
      setSelectedBlog: (blog) => set({ selectedBlog: blog }),
      clearSelectedBlog: () => set({ selectedBlog: null }),

      setProofreadingSuggestions: (suggestions) => set({ proofreadingSuggestions: suggestions }),
      clearProofreadingSuggestions: () => set({ proofreadingSuggestions: [] }),

      setIsAnalyzingProofreading: (isAnalyzing) => set({ isAnalyzingProofreading: isAnalyzing }),

      setGeneratedTitles: (titles) => set({ generatedTitles: titles }),

      setBlogPrompt: (id, prompt) =>
        set((state) => ({ blogPrompts: { ...state.blogPrompts, [id]: prompt } })),

      // Cleared on account switch — cached blog UI state must not leak across accounts.
      reset: () =>
        set({
          selectedBlog: null,
          proofreadingSuggestions: [],
          isAnalyzingProofreading: false,
          generatedTitles: [],
          blogPrompts: {},
        }),

      createNewBlog: async ({ blogData, navigate, queryClient }) => {
        try {
          const newBlog = await createBlog(blogData)
          queryClient.invalidateQueries({ queryKey: ["blogs"] })
          pushBlogCreationEvent({
            status: "success",
            blogType: "advanced",
            blog: newBlog,
            blogData,
          })
          if (newBlog) {
            navigate("/blogs")
            toast.success("Blog creation has started!")
          }
        } catch (error) {
          pushBlogCreationEvent({ status: "error", blogType: "advanced", blogData, error })
          throw error
        }
      },

      createMultiBlog: async ({ blogData, navigate, queryClient }) => {
        try {
          const newBlogs = await createBlogMultiple(blogData)
          queryClient.invalidateQueries({ queryKey: ["blogs"] })
          pushBlogCreationEvent({ status: "success", blogType: "multi", blogData })
          if (newBlogs) {
            navigate("/blogs")
            toast.success("Blogs created successfully!")
          }
        } catch (error) {
          pushBlogCreationEvent({ status: "error", blogType: "multi", blogData, error })
          throw error
        }
      },

      createNewQuickBlog: async ({ blogData, navigate, type, queryClient }) => {
        try {
          const newBlog = await createQuickBlog(blogData, type)
          queryClient.invalidateQueries({ queryKey: ["blogs"] })
          pushBlogCreationEvent({
            status: "success",
            blogType: type || "quick",
            blog: newBlog,
            blogData,
          })
          if (newBlog) {
            navigate("/blogs")
            toast.success("Blog creation has started!")
          }
        } catch (error) {
          pushBlogCreationEvent({ status: "error", blogType: type || "quick", blogData, error })
          throw error
        }
      },

      createTopicBlog: async ({ topic, navigate, queryClient }) => {
        try {
          const newBlog = await createTopicOnlyBlog({ topic })
          queryClient.invalidateQueries({ queryKey: ["blogs"] })
          pushBlogCreationEvent({
            status: "success",
            blogType: "topic",
            blog: newBlog,
            blogData: { topic },
          })
          if (newBlog) {
            navigate("/blogs")
            toast.success("Blog creation has started!")
          }
          return newBlog
        } catch (error) {
          pushBlogCreationEvent({ status: "error", blogType: "topic", blogData: { topic }, error })
          throw error
        }
      },
    }),
    { name: "blog-store" }
  )
)

export default useBlogStore
