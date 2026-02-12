import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { analyzeKeywords, fetchGoogleSuggestions, runCompetitiveAnalysis } from "@api/analysisApi"
import { message } from "antd"

const useAnalysisStore = create(
  devtools(
    (set, get) => ({
      selectedKeywords: [],
      keywordAnalysis: [],
      suggestions: [],
      analysisResult: {},
      loading: false,
      error: null,

      // Actions
      setSelectedKeywords: keywords => set({ selectedKeywords: keywords }),
      clearSelectedKeywords: () => set({ selectedKeywords: [] }),

      setKeywordAnalysis: analysis => set({ keywordAnalysis: analysis }),
      clearKeywordAnalysis: () => set({ keywordAnalysis: [] }),

      setSuggestions: suggestions => set({ suggestions }),
      clearSuggestions: () => set({ suggestions: [] }),

      setAnalysisResult: (blogId, result) =>
        set(state => ({ analysisResult: { ...state.analysisResult, [blogId]: result } })),

      clearAnalysis: blogId =>
        set(state => {
          if (!blogId) return { analysisResult: {} }
          const newResult = { ...state.analysisResult }
          delete newResult[blogId]
          return { analysisResult: newResult }
        }),

      // Async Actions
      runKeywordAnalysis: async keywords => {
        set({ loading: true, error: null })
        try {
          const result = await analyzeKeywords(keywords)
          set({ keywordAnalysis: result, loading: false })
          return result
        } catch (err) {
          const errorMsg = err?.response?.data?.message || "Failed to analyze keywords."
          message.error(errorMsg)
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      fetchKeywordSuggestions: async query => {
        set({ loading: true, error: null })
        try {
          const suggestions = await fetchGoogleSuggestions(query)
          set({ suggestions, loading: false })
          return suggestions
        } catch (error) {
          set({ loading: false, error: "Failed to fetch suggestions" })
          throw error
        }
      },

      fetchCompetitiveAnalysis: async ({ blogId, title, content, keywords }) => {
        set({ loading: true, error: null })
        try {
          const data = await runCompetitiveAnalysis({ blogId, title, content, keywords })
          message.success("Competitive analysis completed successfully!")
          if (blogId) {
            set(state => ({
              analysisResult: { ...state.analysisResult, [blogId]: data },
              loading: false,
            }))
          } else {
            set({ loading: false })
          }
          return data
        } catch (error) {
          const errorMsg = error.response?.data?.message || "Failed to fetch competitive analysis."
          message.error(errorMsg)
          set({ loading: false, error: errorMsg })
          throw error
        }
      },
    }),
    { name: "analysis-store" }
  )
)

export default useAnalysisStore
