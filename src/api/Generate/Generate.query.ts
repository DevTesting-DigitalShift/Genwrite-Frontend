// src/api/Generate/Generate.query.ts
import type { UseMutationOptions } from "@tanstack/react-query"
import { QueryBase, type QueryError } from "@api/QueryBase"
import { GenerateAPI } from "./Generate.api"

type MutationOf<TFn extends (...args: any) => Promise<any>> = UseMutationOptions<
  Awaited<ReturnType<TFn>>,
  QueryError,
  Parameters<TFn>[0]
>

/** Every hook takes an optional `options` (onMutate/onSuccess/onError/...), the same shape
 * react-query's own useMutation takes — so a caller that needs to write a result into a
 * zustand store (useToolsStore, useHumanizeStore, ...) wires that through here at the call
 * site instead of importing GenerateAPI directly. This is the only file that imports
 * Generate.api.ts; every other caller goes through generateQuery. */
class GenerateQuery extends QueryBase<unknown> {
  baseKey = ["generate"]
  api = GenerateAPI

  useHumanizeContent = (options?: MutationOf<typeof GenerateAPI.humanizeContent>) =>
    this.useMutate((payload) => this.api.humanizeContent(payload), options)

  useCreateOutline = (options?: MutationOf<typeof GenerateAPI.createOutline>) =>
    this.useMutate((payload) => this.api.createOutline(payload), options)

  useGenerateMetadata = (options?: MutationOf<typeof GenerateAPI.generateMetadata>) =>
    this.useMutate((payload) => this.api.generateMetadata(payload), options)

  useGeneratePromptContent = (options?: MutationOf<typeof GenerateAPI.generatePromptContent>) =>
    this.useMutate((payload) => this.api.generatePromptContent(payload), options)

  useDetectAiContent = (options?: MutationOf<typeof GenerateAPI.detectAiContent>) =>
    this.useMutate((payload) => this.api.detectAiContent(payload), options)

  useScrapeKeywords = (options?: MutationOf<typeof GenerateAPI.scrapeKeywords>) =>
    this.useMutate((payload) => this.api.scrapeKeywords(payload), options)

  useSummarizeYoutube = (options?: MutationOf<typeof GenerateAPI.summarizeYoutube>) =>
    this.useMutate((payload) => this.api.summarizeYoutube(payload), options)

  usePdfChat = (options?: MutationOf<typeof GenerateAPI.pdfChat>) =>
    this.useMutate((payload) => this.api.pdfChat(payload), options)

  useLikeCompetitor = (options?: MutationOf<typeof GenerateAPI.likeCompetitor>) =>
    this.useMutate((payload) => this.api.likeCompetitor(payload), options)

  useAnalyseWebsite = (options?: MutationOf<typeof GenerateAPI.analyseWebsite>) =>
    this.useMutate((payload) => this.api.analyseWebsite(payload), options)

  useCreateWebsitePrompts = (options?: MutationOf<typeof GenerateAPI.createWebsitePrompts>) =>
    this.useMutate((payload) => this.api.createWebsitePrompts(payload), options)

  useCheckWebsiteRankings = (options?: MutationOf<typeof GenerateAPI.checkWebsiteRankings>) =>
    this.useMutate((payload) => this.api.checkWebsiteRankings(payload), options)

  useGenerateAdvancedAnalysis = (
    options?: MutationOf<typeof GenerateAPI.generateAdvancedAnalysis>
  ) => this.useMutate((payload) => this.api.generateAdvancedAnalysis(payload), options)

  useWebsiteRankingOrchestrator = (
    options?: MutationOf<typeof GenerateAPI.websiteRankingOrchestrator>
  ) => this.useMutate((payload) => this.api.websiteRankingOrchestrator(payload), options)
}

export const generateQuery = new GenerateQuery() as GenerateQuery
