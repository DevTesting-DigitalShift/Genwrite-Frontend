import { apiErrorMessage } from "@/types/api"
import { useMutation } from "@tanstack/react-query"
import useToolsStore from "@store/useToolsStore"
import {
  detectAiContentApi,
  scrapeKeywordsApi,
  summarizeYoutubeApi,
  pdfChatApi,
  likeCompetitorApi,
  analyseWebsiteApi,
  createWebsitePromptsApi,
  checkWebsiteRankingsApi,
  generateAdvancedAnalysisApi,
  websiteRankingOrchestratorApi,
} from "../toolsApi"

/* ================== AI Content Detection ================== */
export const useAiDetectionMutation = () => {
  const { setAiDetectionResult, setAiDetectionError, resetAiDetection } = useToolsStore()

  return useMutation({
    mutationFn: detectAiContentApi,
    onMutate: () => {
      resetAiDetection()
    },
    onSuccess: (data) => {
      setAiDetectionResult(data)
    },
    onError: (error) => {
      setAiDetectionError(apiErrorMessage(error, "Something went wrong"))
    },
  })
}

/* ================== Keyword Scraping ================== */
export const useKeywordScrapingMutation = () => {
  const { setKeywordScrapingResult, setKeywordScrapingError, resetKeywordScraping } =
    useToolsStore()

  return useMutation({
    mutationFn: scrapeKeywordsApi,
    onMutate: () => {
      resetKeywordScraping()
    },
    onSuccess: (data) => {
      setKeywordScrapingResult(data)
    },
    onError: (error) => {
      setKeywordScrapingError(apiErrorMessage(error, "Something went wrong"))
    },
  })
}

/* ================== YouTube Summarization ================== */
export const useYoutubeSummaryMutation = () => {
  const { setYoutubeSummaryResult, setYoutubeSummaryError, resetYoutubeSummary } = useToolsStore()

  return useMutation({
    mutationFn: summarizeYoutubeApi,
    onMutate: () => {
      resetYoutubeSummary()
    },
    onSuccess: (data) => {
      setYoutubeSummaryResult(data)
    },
    onError: (error) => {
      setYoutubeSummaryError(apiErrorMessage(error, "Something went wrong"))
    },
  })
}

/* ================== PDF Chat ================== */
export const usePdfChatMutation = () => {
  const { setPdfChatResult, setPdfChatError } = useToolsStore()

  return useMutation({
    mutationFn: pdfChatApi,
    onSuccess: (data) => {
      setPdfChatResult(data)
    },
    onError: (error) => {
      setPdfChatError(apiErrorMessage(error, "Something went wrong"))
    },
  })
}

/* ================== Competitor Like Blog ================== */
export const useCompetitorLikeBlogMutation = () => {
  const { setCompetitorLikeBlogResult, setCompetitorLikeBlogError, resetCompetitorLikeBlog } =
    useToolsStore()

  return useMutation({
    mutationFn: likeCompetitorApi,
    onMutate: () => {
      resetCompetitorLikeBlog()
    },
    onSuccess: (data) => {
      setCompetitorLikeBlogResult(data)
    },
    onError: (error) => {
      setCompetitorLikeBlogError(apiErrorMessage(error, "Something went wrong"))
    },
  })
}

/* ================== Website Ranking ================== */
const useWebsiteRankingMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  key: Parameters<ReturnType<typeof useToolsStore.getState>["setWebsiteRankingResult"]>[0]
) => {
  const { setWebsiteRankingResult, setWebsiteRankingError } = useToolsStore()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      setWebsiteRankingResult(key, data)
    },
    onError: (error) => {
      setWebsiteRankingError(key, apiErrorMessage(error, "Something went wrong"))
    },
  })
}

export const useWebsiteAnalysisMutation = () =>
  useWebsiteRankingMutation(analyseWebsiteApi, "analyser")
export const useWebsitePromptsMutation = () =>
  useWebsiteRankingMutation(createWebsitePromptsApi, "prompts")
export const useWebsiteRankingsCheckMutation = () =>
  useWebsiteRankingMutation(checkWebsiteRankingsApi, "rankings")
export const useWebsiteAdvancedAnalysisMutation = () =>
  useWebsiteRankingMutation(generateAdvancedAnalysisApi, "advancedComp")
export const useWebsiteOrchestratorMutation = () =>
  useWebsiteRankingMutation(websiteRankingOrchestratorApi, "orchestrator")
