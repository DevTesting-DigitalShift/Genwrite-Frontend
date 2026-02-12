import { create } from "zustand"
import { devtools } from "zustand/middleware"

const useBlogStore = create(
  devtools(
    set => ({
      selectedBlog: null,
      proofreadingSuggestions: [],
      isAnalyzingProofreading: false,
      generatedTitles: [],

      // Actions
      setSelectedBlog: blog => set({ selectedBlog: blog }),
      clearSelectedBlog: () => set({ selectedBlog: null }),

      setProofreadingSuggestions: suggestions => set({ proofreadingSuggestions: suggestions }),
      setIsAnalyzingProofreading: isAnalyzing => set({ isAnalyzingProofreading: isAnalyzing }),
      clearProofreadingSuggestions: () => set({ proofreadingSuggestions: [] }),

      setGeneratedTitles: titles => set({ generatedTitles: titles }),
      clearGeneratedTitles: () => set({ generatedTitles: [] }),
    }),
    { name: "blog-store" }
  )
)

export default useBlogStore
