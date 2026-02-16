import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { analyzeKeywords, fetchGoogleSuggestions, runCompetitiveAnalysis } from "@api/analysisApi"
import { message } from "antd"

export const useCompetitiveAnalysisMutation = () => {
  return useMutation({
    mutationFn: ({ blogId, title, content, keywords }) =>
      runCompetitiveAnalysis({ blogId, title, content, keywords }),
    onSuccess: () => {
      message.success("Competitive analysis completed successfully!")
    },
    onError: error => {
      message.error(error.response?.data?.message || "Failed to fetch competitive analysis.")
    },
  })
}

export const useAnalyzeKeywordsMutation = () => {
  return useMutation({
    mutationFn: analyzeKeywords,
    onError: err => {
      message.error(err?.response?.data?.message || "Failed to analyze keywords.")
    },
  })
}

export const useKeywordSuggestionsQuery = (query, enabled = false) => {
  return useQuery({
    queryKey: ["keywordSuggestions", query],
    queryFn: () => fetchGoogleSuggestions(query),
    enabled: enabled && !!query,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
