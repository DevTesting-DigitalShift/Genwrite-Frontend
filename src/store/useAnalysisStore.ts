import { apiErrorMessage } from "@/types/api"
import { analyzeKeywords, fetchGoogleSuggestions, runCompetitiveAnalysis } from "@api/analysisApi"
import { toast } from "sonner"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface CompetitiveAnalysisArgs {
  blogId: string
  title?: string
  content?: string
  keywords?: string[]
}

/** Keyword selection carried between the analysis tools and the blog modals. */
export interface SelectedKeywords {
  focusKeywords?: string[]
  keywords?: string[]
  allKeywords?: string[]
  [key: string]: any
}

interface AnalysisState {
  keywordAnalysis: any[]
  suggestions: any[]
  loading: boolean
  /** Keyed by blogId. */
  analysisResult: Record<string, unknown>
  error: string | null
  selectedKeywords: SelectedKeywords
  pendingImport: string | null

  setPendingImport: (type: string | null) => void
  setAnalysisResult: (blogId: string, data: unknown) => void
  setSelectedKeywords: (selectedKeywords: SelectedKeywords) => void
  clearSelectedKeywords: () => void
  clearKeywordAnalysis: () => void
  clearSuggestions: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  fetchCompetitiveAnalysis: (args: CompetitiveAnalysisArgs) => Promise<any>
  analyzeKeywords: (keywords: string[]) => Promise<any>
  fetchSuggestions: (query: string) => Promise<any>
}

const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set) => ({
      keywordAnalysis: [],
      suggestions: [],
      loading: false,
      analysisResult: {},
      error: null,
      selectedKeywords: [] as unknown as SelectedKeywords,
      pendingImport: null,

      // Actions
      setPendingImport: (type) => set({ pendingImport: type }),

      setAnalysisResult: (blogId, data) =>
        set((state) => ({ analysisResult: { ...state.analysisResult, [blogId]: data } })),

      setSelectedKeywords: (selectedKeywords) => set({ selectedKeywords }),

      clearSelectedKeywords: () =>
        set({ selectedKeywords: [] as unknown as SelectedKeywords, pendingImport: null }),

      clearKeywordAnalysis: () => set({ keywordAnalysis: [] }),

      clearSuggestions: () => set({ suggestions: [], error: null }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      // Cleared on account switch.
      reset: () =>
        set({
          keywordAnalysis: [],
          suggestions: [],
          loading: false,
          analysisResult: {},
          error: null,
          selectedKeywords: [] as unknown as SelectedKeywords,
          pendingImport: null,
        }),

      // Async Actions
      fetchCompetitiveAnalysis: async ({ blogId, title, content, keywords }) => {
        set({ loading: true, error: null })
        try {
          const data = await runCompetitiveAnalysis({ blogId, title, content, keywords })
          set((state) => ({
            analysisResult: { ...state.analysisResult, [blogId]: data },
            loading: false,
          }))
          toast.success("Competitive analysis completed successfully!")
          return data
        } catch (error) {
          console.error("Competitive analysis error", error)
          const errMsg = apiErrorMessage(error, "Failed to fetch competitive analysis.")
          toast.error(errMsg)
          set({ error: errMsg, loading: false })
          throw error
        }
      },

      analyzeKeywords: async (keywords) => {
        set({ loading: true, error: null })
        try {
          const result = await analyzeKeywords(keywords)
          set({ keywordAnalysis: result, loading: false })
          return result
        } catch (err) {
          const errMsg = apiErrorMessage(err, "Failed to analyze keywords.")
          toast.error(errMsg)
          set({ error: errMsg, loading: false })
          throw err
        }
      },

      fetchSuggestions: async (query) => {
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
