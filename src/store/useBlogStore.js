import { create } from "zustand"
import { devtools } from "zustand/middleware"

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
    }),
    { name: "blog-store" }
  )
)

export default useBlogStore
