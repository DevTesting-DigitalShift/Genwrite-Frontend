// src/api/Generate/Generate.query.ts
import { QueryBase } from "@api/QueryBase"
import { GenerateAPI } from "./Generate.api"

/** Every hook here is a plain mutation with no store/toast side effects baked in — unlike the
 * old toolsQueries.ts/humanizeQueries.ts, which each wrote results into a specific zustand
 * store (useToolsStore/useHumanizeStore). Call sites own that wiring themselves via the
 * mutation's own onSuccess/onError, same as Auth.query.ts/Payments.query.ts. */
class GenerateQuery extends QueryBase<unknown> {
  baseKey = ["generate"]
  api = GenerateAPI

  useHumanizeContent = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.humanizeContent>>,
      Parameters<typeof GenerateAPI.humanizeContent>[0]
    >((payload) => this.api.humanizeContent(payload))

  useCreateOutline = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.createOutline>>,
      Parameters<typeof GenerateAPI.createOutline>[0]
    >((payload) => this.api.createOutline(payload))

  useGenerateMetadata = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.generateMetadata>>,
      Parameters<typeof GenerateAPI.generateMetadata>[0]
    >((payload) => this.api.generateMetadata(payload))

  useGeneratePromptContent = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.generatePromptContent>>,
      Parameters<typeof GenerateAPI.generatePromptContent>[0]
    >((payload) => this.api.generatePromptContent(payload))

  useDetectAiContent = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.detectAiContent>>,
      Parameters<typeof GenerateAPI.detectAiContent>[0]
    >((payload) => this.api.detectAiContent(payload))

  useScrapeKeywords = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.scrapeKeywords>>,
      Parameters<typeof GenerateAPI.scrapeKeywords>[0]
    >((payload) => this.api.scrapeKeywords(payload))

  useSummarizeYoutube = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.summarizeYoutube>>,
      Parameters<typeof GenerateAPI.summarizeYoutube>[0]
    >((payload) => this.api.summarizeYoutube(payload))

  usePdfChat = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.pdfChat>>,
      Parameters<typeof GenerateAPI.pdfChat>[0]
    >((payload) => this.api.pdfChat(payload))

  useLikeCompetitor = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.likeCompetitor>>,
      Parameters<typeof GenerateAPI.likeCompetitor>[0]
    >((payload) => this.api.likeCompetitor(payload))

  useAnalyseWebsite = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.analyseWebsite>>,
      Parameters<typeof GenerateAPI.analyseWebsite>[0]
    >((payload) => this.api.analyseWebsite(payload))

  useCreateWebsitePrompts = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.createWebsitePrompts>>,
      Parameters<typeof GenerateAPI.createWebsitePrompts>[0]
    >((payload) => this.api.createWebsitePrompts(payload))

  useCheckWebsiteRankings = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.checkWebsiteRankings>>,
      Parameters<typeof GenerateAPI.checkWebsiteRankings>[0]
    >((payload) => this.api.checkWebsiteRankings(payload))

  useGenerateAdvancedAnalysis = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.generateAdvancedAnalysis>>,
      Parameters<typeof GenerateAPI.generateAdvancedAnalysis>[0]
    >((payload) => this.api.generateAdvancedAnalysis(payload))

  useWebsiteRankingOrchestrator = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.websiteRankingOrchestrator>>,
      Parameters<typeof GenerateAPI.websiteRankingOrchestrator>[0]
    >((payload) => this.api.websiteRankingOrchestrator(payload))
}

export const generateQuery = new GenerateQuery() as GenerateQuery
