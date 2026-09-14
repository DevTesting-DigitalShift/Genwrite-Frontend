// src/api/Analysis/Analysis.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { AnalysisAPI } from "./Analysis.api"
import type { ApiResponse } from "@/types/apiHelpers"
import { toast } from "sonner"

class AnalysisQuery extends QueryBase<unknown> {
  baseKey = ["analysis"]
  api = AnalysisAPI

  useCompetitiveAnalysis = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/analysis/run", "post">,
      Parameters<typeof AnalysisAPI.runCompetitiveAnalysis>[0]
    >((payload) => this.api.runCompetitiveAnalysis(payload), {
      ...options,
      onSuccess: () => {
        toast.success("Competitive analysis completed successfully!")
        options?.onSuccess?.()
      },
      onError: (error) => {
        toast.error(error.message || "Failed to fetch competitive analysis.")
        options?.onError?.(error)
      },
    })

  useAnalyzeKeywords = (options?: { onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/analysis/keywords", "post">, string[]>(
      (keywords) => this.api.analyzeKeywords(keywords),
      {
        onError: (error) => {
          toast.error(error.message || "Failed to analyze keywords.")
          options?.onError?.(error)
        },
      }
    )

  useKeywordSuggestions = (
    query: string,
    enabled = false,
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof AnalysisAPI.fetchGoogleSuggestions>>>
  ) =>
    this.useFetchQuery(
      `keywordSuggestions-${query}`,
      () => this.api.fetchGoogleSuggestions(query),
      { enabled: enabled && !!query, staleTime: 5 * 60 * 1000, ...options }
    )

  useBlogStatus = (
    params?: Record<string, unknown>,
    options?: AnyUseQueryOptions<ApiResponse<"/blogs/status", "get">>
  ) => this.useParamQuery("blogStatus", (p) => this.api.getBlogStatus(p), params, options)
}

export const analysisQuery = new AnalysisQuery() as AnalysisQuery
