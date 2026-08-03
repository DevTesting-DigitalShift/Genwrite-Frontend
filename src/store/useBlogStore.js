import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { toast } from "sonner"
import { createBlog, createBlogMultiple, createQuickBlog, createTopicOnlyBlog } from "@api/blogApi"
import { pushBlogCreationEvent } from "@utils/creationEvents"

const useBlogStore = create(
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
