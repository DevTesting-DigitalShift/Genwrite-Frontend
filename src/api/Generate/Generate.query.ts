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
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.humanizeContent>>, unknown>((payload) =>
      this.api.humanizeContent(payload)
    )

  useCreateOutline = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.createOutline>>, unknown>((payload) =>
      this.api.createOutline(payload)
    )

  useGenerateMetadata = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.generateMetadata>>, unknown>((payload) =>
      this.api.generateMetadata(payload)
    )

  useGeneratePromptContent = () =>
    this.useMutate<
      Awaited<ReturnType<typeof GenerateAPI.generatePromptContent>>,
      Parameters<typeof GenerateAPI.generatePromptContent>[0]
    >((payload) => this.api.generatePromptContent(payload))

  useDetectAiContent = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.detectAiContent>>, unknown>((payload) =>
      this.api.detectAiContent(payload)
    )

  useScrapeKeywords = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.scrapeKeywords>>, unknown>((payload) =>
      this.api.scrapeKeywords(payload)
    )

  useSummarizeYoutube = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.summarizeYoutube>>, unknown>((payload) =>
      this.api.summarizeYoutube(payload)
    )

  usePdfChat = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.pdfChat>>, unknown>((payload) =>
      this.api.pdfChat(payload)
    )

  useLikeCompetitor = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.likeCompetitor>>, unknown>((payload) =>
      this.api.likeCompetitor(payload)
    )

  useAnalyseWebsite = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.analyseWebsite>>, unknown>((payload) =>
      this.api.analyseWebsite(payload)
    )

  useCreateWebsitePrompts = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.createWebsitePrompts>>, unknown>(
      (payload) => this.api.createWebsitePrompts(payload)
    )

  useCheckWebsiteRankings = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.checkWebsiteRankings>>, unknown>(
      (payload) => this.api.checkWebsiteRankings(payload)
    )

  useGenerateAdvancedAnalysis = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.generateAdvancedAnalysis>>, unknown>(
      (payload) => this.api.generateAdvancedAnalysis(payload)
    )

  useWebsiteRankingOrchestrator = () =>
    this.useMutate<Awaited<ReturnType<typeof GenerateAPI.websiteRankingOrchestrator>>, unknown>(
      (payload) => this.api.websiteRankingOrchestrator(payload)
    )
}

export const generateQuery = new GenerateQuery() as GenerateQuery
