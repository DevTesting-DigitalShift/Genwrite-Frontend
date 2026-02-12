import { create } from "zustand"

const useToolsStore = create(set => ({
  aiDetection: { result: null, error: null },
  setAiDetectionResult: result =>
    set(state => ({ aiDetection: { ...state.aiDetection, result, error: null } })),
  setAiDetectionError: error => set(state => ({ aiDetection: { ...state.aiDetection, error } })),
  resetAiDetection: () => set(state => ({ aiDetection: { result: null, error: null } })),

  keywordScraping: { result: null, error: null },
  setKeywordScrapingResult: result =>
    set(state => ({ keywordScraping: { ...state.keywordScraping, result, error: null } })),
  setKeywordScrapingError: error =>
    set(state => ({ keywordScraping: { ...state.keywordScraping, error } })),
  resetKeywordScraping: () => set(state => ({ keywordScraping: { result: null, error: null } })),

  youtubeSummary: { result: null, error: null },
  setYoutubeSummaryResult: result =>
    set(state => ({ youtubeSummary: { ...state.youtubeSummary, result, error: null } })),
  setYoutubeSummaryError: error =>
    set(state => ({ youtubeSummary: { ...state.youtubeSummary, error } })),
  resetYoutubeSummary: () => set(state => ({ youtubeSummary: { result: null, error: null } })),

  pdfChat: { result: null, error: null, messages: [], cacheKey: null },
  setPdfChatResult: result =>
    set(state => ({
      pdfChat: {
        ...state.pdfChat,
        result,
        error: null,
        cacheKey: result.cacheKey || state.pdfChat.cacheKey,
      },
    })),
  setPdfChatError: error => set(state => ({ pdfChat: { ...state.pdfChat, error } })),
  addPdfChatMessage: message =>
    set(state => ({
      pdfChat: { ...state.pdfChat, messages: [...state.pdfChat.messages, message] },
    })),
  resetPdfChat: () =>
    set(state => ({ pdfChat: { result: null, error: null, messages: [], cacheKey: null } })),

  competitorLikeBlog: { result: null, error: null },
  setCompetitorLikeBlogResult: result =>
    set(state => ({ competitorLikeBlog: { ...state.competitorLikeBlog, result, error: null } })),
  setCompetitorLikeBlogError: error =>
    set(state => ({ competitorLikeBlog: { ...state.competitorLikeBlog, error } })),
  resetCompetitorLikeBlog: () =>
    set(state => ({ competitorLikeBlog: { result: null, error: null } })),

  websiteRanking: {
    analyser: { result: null, error: null },
    prompts: { result: null, error: null },
    rankings: { result: null, error: null },
    advancedComp: { result: null, error: null },
    orchestrator: { result: null, error: null },
  },
  setWebsiteRankingResult: (key, result) =>
    set(state => ({
      websiteRanking: {
        ...state.websiteRanking,
        [key]: { ...state.websiteRanking[key], result, error: null },
      },
    })),
  setWebsiteRankingError: (key, error) =>
    set(state => ({
      websiteRanking: { ...state.websiteRanking, [key]: { ...state.websiteRanking[key], error } },
    })),
  resetWebsiteRanking: () =>
    set(state => ({
      websiteRanking: {
        analyser: { result: null, error: null },
        prompts: { result: null, error: null },
        rankings: { result: null, error: null },
        advancedComp: { result: null, error: null },
        orchestrator: { result: null, error: null },
      },
    })),
}))

export default useToolsStore
