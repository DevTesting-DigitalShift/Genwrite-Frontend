import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { components } from "@/types/apiSchema"

type CompetitorAnalysisResponse = components["schemas"]["CompetitorAnalysisResponse"]

/** Keyword selection carried between the analysis tools and the blog modals. */
export interface SelectedKeywords {
  focusKeywords?: string[]
  keywords?: string[]
  allKeywords?: string[]
  [key: string]: any
}

/**
 * Pure client state. Every fetch (competitive analysis, keyword analysis) goes through
 * analysisQuery (Analysis.query.ts) — callers write the result here via setKeywordAnalysis/
 * setAnalysisResult themselves, same split as useIntegrationStore/useImageStore.
 */
interface AnalysisState {
  keywordAnalysis: any[]
  loading: boolean
  /** Keyed by blogId. */
  analysisResult: Record<string, CompetitorAnalysisResponse>
  error: string | null
  selectedKeywords: SelectedKeywords
  pendingImport: string | null

  setPendingImport: (type: string | null) => void
  setAnalysisResult: (blogId: string, data: CompetitorAnalysisResponse) => void
  setKeywordAnalysis: (result: any[]) => void
  setSelectedKeywords: (selectedKeywords: SelectedKeywords) => void
  clearSelectedKeywords: () => void
  clearKeywordAnalysis: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set) => ({
      keywordAnalysis: [],
      loading: false,
      analysisResult: {},
      error: null,
      selectedKeywords: [] as unknown as SelectedKeywords,
      pendingImport: null,

      // Actions
      setPendingImport: (type) => set({ pendingImport: type }),

      setAnalysisResult: (blogId, data) =>
        set((state) => ({ analysisResult: { ...state.analysisResult, [blogId]: data } })),

      setKeywordAnalysis: (keywordAnalysis) => set({ keywordAnalysis }),

      setSelectedKeywords: (selectedKeywords) => set({ selectedKeywords }),

      clearSelectedKeywords: () =>
        set({ selectedKeywords: [] as unknown as SelectedKeywords, pendingImport: null }),

      clearKeywordAnalysis: () => set({ keywordAnalysis: [] }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      // Cleared on account switch.
      reset: () =>
        set({
          keywordAnalysis: [],
          loading: false,
          analysisResult: {},
          error: null,
          selectedKeywords: [] as unknown as SelectedKeywords,
          pendingImport: null,
        }),
    }),
    { name: "analysis-store" }
  )
)

export default useAnalysisStore
