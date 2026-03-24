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
    onSuccess: data => {
      setAiDetectionResult(data)
    },
    onError: error => {
      setAiDetectionError(error.response?.data || error.message)
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
    onSuccess: data => {
      setKeywordScrapingResult(data)
    },
    onError: error => {
      setKeywordScrapingError(error.response?.data || error.message)
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
    onSuccess: data => {
      setYoutubeSummaryResult(data)
    },
    onError: error => {
      setYoutubeSummaryError(error.response?.data || error.message)
    },
  })
}

/* ================== PDF Chat ================== */
export const usePdfChatMutation = () => {
  const { setPdfChatResult, setPdfChatError } = useToolsStore()

  return useMutation({
    mutationFn: pdfChatApi,
    onSuccess: data => {
      setPdfChatResult(data)
    },
    onError: error => {
      setPdfChatError(error.response?.data || error.message)
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
    onSuccess: data => {
      setCompetitorLikeBlogResult(data)
    },
    onError: error => {
      setCompetitorLikeBlogError(error.response?.data || error.message)
    },
  })
}

/* ================== Website Ranking ================== */
const useWebsiteRankingMutation = (mutationFn, key) => {
  const { setWebsiteRankingResult, setWebsiteRankingError } = useToolsStore()

  return useMutation({
    mutationFn,
    onSuccess: data => {
      setWebsiteRankingResult(key, data)
    },
    onError: error => {
      setWebsiteRankingError(key, error.response?.data || error.message)
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
