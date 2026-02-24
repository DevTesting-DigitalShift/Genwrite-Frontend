import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { analyzeKeywords, fetchGoogleSuggestions, runCompetitiveAnalysis } from "@api/analysisApi"
import { toast } from "sonner"

const useAnalysisStore = create(
  devtools(
    set => ({
      keywordAnalysis: [],
      suggestions: [],
      loading: false,
      analysisResult: {},
      error: null,
      selectedKeywords: [],

      // Actions
      setAnalysisResult: (blogId, data) =>
        set(state => ({ analysisResult: { ...state.analysisResult, [blogId]: data } })),

      setSelectedKeywords: selectedKeywords => set({ selectedKeywords }),

      clearSelectedKeywords: () => set({ selectedKeywords: [] }),

      clearKeywordAnalysis: () => set({ keywordAnalysis: [] }),

      clearSuggestions: () => set({ suggestions: [], error: null }),

      setLoading: loading => set({ loading }),

      setError: error => set({ error }),

      // Async Actions
      fetchCompetitiveAnalysis: async ({ blogId, title, content, keywords }) => {
        set({ loading: true, error: null })
        try {
          const data = await runCompetitiveAnalysis({ blogId, title, content, keywords })
          set(state => ({
            analysisResult: { ...state.analysisResult, [blogId]: data },
            loading: false,
          }))
          toast.success("Competitive analysis completed successfully!")
          return data
        } catch (error) {
          console.error("Competitive analysis error", error)
          const errMsg = error.response?.data?.message || "Failed to fetch competitive analysis."
          toast.error(errMsg)
          set({ error: errMsg, loading: false })
          throw error
        }
      },

      analyzeKeywords: async keywords => {
        set({ loading: true, error: null })
        try {
          const result = await analyzeKeywords(keywords)
          set({ keywordAnalysis: result, loading: false })
          return result
        } catch (err) {
          const errMsg = err?.response?.data?.message || "Failed to analyze keywords."
          toast.error(errMsg)
          set({ error: errMsg, loading: false })
          throw err
        }
      },

      fetchSuggestions: async query => {
        set({ loading: true, error: null })
        try {
          const suggestions = await fetchGoogleSuggestions(query)
          set({ suggestions, loading: false })
          return suggestions
        } catch (error) {
          console.error("error", error)
          set({ error: "Failed to fetch suggestions", loading: false })
          throw error
        }
      },
    }),
    { name: "analysis-store" }
  )
)

export default useAnalysisStore
