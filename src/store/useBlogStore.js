import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { toast } from "sonner"
import { createBlog, createBlogMultiple, createQuickBlog } from "@api/blogApi"

const useBlogStore = create(
  devtools(
    set => ({
      selectedBlog: null,
      proofreadingSuggestions: [],
      isAnalyzingProofreading: false,
      generatedTitles: [],
      blogPrompts: {},

      // Actions
      setSelectedBlog: blog => set({ selectedBlog: blog }),
      clearSelectedBlog: () => set({ selectedBlog: null }),

      setProofreadingSuggestions: suggestions => set({ proofreadingSuggestions: suggestions }),
      clearProofreadingSuggestions: () => set({ proofreadingSuggestions: [] }),

      setIsAnalyzingProofreading: isAnalyzing => set({ isAnalyzingProofreading: isAnalyzing }),

      setGeneratedTitles: titles => set({ generatedTitles: titles }),

      setBlogPrompt: (id, prompt) =>
        set(state => ({ blogPrompts: { ...state.blogPrompts, [id]: prompt } })),

      createNewBlog: async ({ blogData, user, navigate, queryClient }) => {
        try {
          const newBlog = await createBlog(blogData)
          queryClient.invalidateQueries(["blogs"])
          if (newBlog) {
            navigate("/blogs")
            toast.success("Blog creation has started!")
          }
        } catch (error) {
          throw error
        }
      },

      createMultiBlog: async ({ blogData, user, navigate, queryClient }) => {
        try {
          const newBlogs = await createBlogMultiple(blogData)
          queryClient.invalidateQueries(["blogs"])
          if (newBlogs) {
            navigate("/blogs")
            toast.success("Blogs created successfully!")
          }
        } catch (error) {
          throw error
        }
      },

      createNewQuickBlog: async ({ blogData, user, navigate, type, queryClient }) => {
        try {
          const newBlog = await createQuickBlog(blogData, type)
          queryClient.invalidateQueries(["blogs"])
          if (newBlog) {
            navigate("/blogs")
            toast.success("Blog creation has started!")
          }
        } catch (error) {
          throw error
        }
      },
    }),
    { name: "blog-store" }
  )
)

export default useBlogStore
