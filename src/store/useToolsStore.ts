import { create } from "zustand"

/**
 * The common { result, error } slice shared by every one-shot tool. `result` is the raw
 * endpoint payload — its shape differs per tool, so pages read their own fields off it.
 */
interface ToolSlice {
  result: any | null
  error: any | null
}

interface PdfChatSlice extends ToolSlice {
  messages: unknown[]
  cacheKey: string | null
}

/** The five stages of the website-ranking pipeline. */
type WebsiteRankingKey =
  | "analyser"
  | "prompts"
  | "rankings"
  | "advancedComp"
  | "orchestrator"

type WebsiteRankingSlice = Record<WebsiteRankingKey, ToolSlice>

interface ToolsState {
  aiDetection: ToolSlice
  setAiDetectionResult: (result: unknown) => void
  setAiDetectionError: (error: unknown) => void
  resetAiDetection: () => void

  keywordScraping: ToolSlice
  setKeywordScrapingResult: (result: unknown) => void
  setKeywordScrapingError: (error: unknown) => void
  resetKeywordScraping: () => void

  youtubeSummary: ToolSlice
  setYoutubeSummaryResult: (result: unknown) => void
  setYoutubeSummaryError: (error: unknown) => void
  resetYoutubeSummary: () => void

  pdfChat: PdfChatSlice
  setPdfChatResult: (result: { cacheKey?: string } & Record<string, unknown>) => void
  setPdfChatError: (error: unknown) => void
  addPdfChatMessage: (message: unknown) => void
  resetPdfChat: () => void

  competitorLikeBlog: ToolSlice
  setCompetitorLikeBlogResult: (result: unknown) => void
  setCompetitorLikeBlogError: (error: unknown) => void
  resetCompetitorLikeBlog: () => void

  websiteRanking: WebsiteRankingSlice
  setWebsiteRankingResult: (key: WebsiteRankingKey, result: unknown) => void
  setWebsiteRankingError: (key: WebsiteRankingKey, error: unknown) => void
  resetWebsiteRanking: () => void

  resetAllTools: () => void
}

const emptySlice = (): ToolSlice => ({ result: null, error: null })
const emptyWebsiteRanking = (): WebsiteRankingSlice => ({
  analyser: emptySlice(),
  prompts: emptySlice(),
  rankings: emptySlice(),
  advancedComp: emptySlice(),
  orchestrator: emptySlice(),
})

const useToolsStore = create<ToolsState>((set) => ({
  aiDetection: emptySlice(),
  setAiDetectionResult: (result) =>
    set((state) => ({ aiDetection: { ...state.aiDetection, result, error: null } })),
  setAiDetectionError: (error) =>
    set((state) => ({ aiDetection: { ...state.aiDetection, error } })),
  resetAiDetection: () => set(() => ({ aiDetection: emptySlice() })),

  keywordScraping: emptySlice(),
  setKeywordScrapingResult: (result) =>
    set((state) => ({ keywordScraping: { ...state.keywordScraping, result, error: null } })),
  setKeywordScrapingError: (error) =>
    set((state) => ({ keywordScraping: { ...state.keywordScraping, error } })),
  resetKeywordScraping: () => set(() => ({ keywordScraping: emptySlice() })),

  youtubeSummary: emptySlice(),
  setYoutubeSummaryResult: (result) =>
    set((state) => ({ youtubeSummary: { ...state.youtubeSummary, result, error: null } })),
  setYoutubeSummaryError: (error) =>
    set((state) => ({ youtubeSummary: { ...state.youtubeSummary, error } })),
  resetYoutubeSummary: () => set(() => ({ youtubeSummary: emptySlice() })),

  pdfChat: { result: null, error: null, messages: [], cacheKey: null },
  setPdfChatResult: (result) =>
    set((state) => ({
      pdfChat: {
        ...state.pdfChat,
        result,
        error: null,
        cacheKey: result.cacheKey || state.pdfChat.cacheKey,
      },
    })),
  setPdfChatError: (error) => set((state) => ({ pdfChat: { ...state.pdfChat, error } })),
  addPdfChatMessage: (message) =>
    set((state) => ({
      pdfChat: { ...state.pdfChat, messages: [...state.pdfChat.messages, message] },
    })),
  resetPdfChat: () =>
    set(() => ({ pdfChat: { result: null, error: null, messages: [], cacheKey: null } })),

  competitorLikeBlog: emptySlice(),
  setCompetitorLikeBlogResult: (result) =>
    set((state) => ({ competitorLikeBlog: { ...state.competitorLikeBlog, result, error: null } })),
  setCompetitorLikeBlogError: (error) =>
    set((state) => ({ competitorLikeBlog: { ...state.competitorLikeBlog, error } })),
  resetCompetitorLikeBlog: () => set(() => ({ competitorLikeBlog: emptySlice() })),

  websiteRanking: emptyWebsiteRanking(),
  setWebsiteRankingResult: (key, result) =>
    set((state) => ({
      websiteRanking: {
        ...state.websiteRanking,
        [key]: { ...state.websiteRanking[key], result, error: null },
      },
    })),
  setWebsiteRankingError: (key, error) =>
    set((state) => ({
      websiteRanking: { ...state.websiteRanking, [key]: { ...state.websiteRanking[key], error } },
    })),
  resetWebsiteRanking: () => set(() => ({ websiteRanking: emptyWebsiteRanking() })),

  resetAllTools: () =>
    set({
      aiDetection: emptySlice(),
      keywordScraping: emptySlice(),
      youtubeSummary: emptySlice(),
      pdfChat: { result: null, error: null, messages: [], cacheKey: null },
      competitorLikeBlog: emptySlice(),
      websiteRanking: emptyWebsiteRanking(),
    }),
}))

export default useToolsStore
