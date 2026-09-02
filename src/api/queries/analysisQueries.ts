import { apiErrorMessage } from "@/types/api"
import { useQuery, useMutation } from "@tanstack/react-query"
import { analyzeKeywords, fetchGoogleSuggestions, runCompetitiveAnalysis } from "@api/analysisApi"
import { toast } from "sonner"

export const useCompetitiveAnalysisMutation = () => {
  return useMutation({
    mutationFn: ({
      blogId,
      title,
      content,
      keywords,
      contentType,
    }: Parameters<typeof runCompetitiveAnalysis>[0]) =>
      runCompetitiveAnalysis({ blogId, title, content, keywords, contentType }),
    onSuccess: () => {
      toast.success("Competitive analysis completed successfully!")
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to fetch competitive analysis."))
    },
  })
}

export const useAnalyzeKeywordsMutation = () => {
  return useMutation({
    mutationFn: analyzeKeywords,
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Failed to analyze keywords."))
    },
  })
}

export const useKeywordSuggestionsQuery = (query: string, enabled = false) => {
  return useQuery({
    queryKey: ["keywordSuggestions", query],
    queryFn: () => fetchGoogleSuggestions(query),
    enabled: enabled && !!query,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
