/**
 * src/api/Generate/Generate.api.ts
 * Every `/generate/*` endpoint (AI content generation + website-ranking tools), consolidated
 * out of the otherApi.ts/toolsApi.ts grab-bags. `/generate/title` stays in Blog.api.ts
 * (getGeneratedTitles) — it's blog-creation-specific and already lived there.
 */
import { apiPost, rethrow, toApiRequestError } from "@api/typedClient"
import axiosInstance from "@api/index"
import type { ApiRequestBody } from "@/types/apiHelpers"

export const GenerateAPI = {
  humanizeContent: async (payload: ApiRequestBody<"/generate/humanised-content", "post">) => {
    try {
      return await apiPost("/generate/humanised-content", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to humanize content")
    }
  },

  createOutline: async (payload: ApiRequestBody<"/generate/outline", "post">) => {
    try {
      return await apiPost("/generate/outline", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to create outline")
    }
  },

  generateMetadata: async (payload: ApiRequestBody<"/generate/metadata", "post">) => {
    try {
      return await apiPost("/generate/metadata", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to generate metadata")
    }
  },

  /** Generate blog content with custom prompt. */
  generatePromptContent: async ({ prompt, content }: { prompt: string; content?: string }) => {
    try {
      return await apiPost("/generate/prompt-content", { prompt, content: content ?? "" })
    } catch (err) {
      return rethrow(err, "Failed to generate prompt content")
    }
  },

  /** AI content detection ("is this AI-written?"). */
  detectAiContent: async (payload: ApiRequestBody<"/generate/detect-ai", "post">) => {
    try {
      return await apiPost("/generate/detect-ai", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to detect AI content")
    }
  },

  scrapeKeywords: async (payload: ApiRequestBody<"/generate/scrape-keywords", "post">) => {
    try {
      return await apiPost("/generate/scrape-keywords", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to scrape keywords")
    }
  },

  summarizeYoutube: async (payload: ApiRequestBody<"/generate/youtube-summary", "post">) => {
    try {
      return await apiPost("/generate/youtube-summary", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to summarize video")
    }
  },

  /**
   * PDF Chat — the request body is genuinely multipart/form-data on the backend
   * (chatWithPDFSchema), not expressible as a typed JSON requestBody, so this stays on plain
   * axios rather than the typed client — same pattern as Blog.api.ts's create.
   */
  pdfChat: async (payload: unknown) => {
    const config =
      payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
    try {
      const response = await axiosInstance.post("/generate/pdf-chat", payload, config)
      return response.data
    } catch (rawError) {
      return rethrow(toApiRequestError(rawError, "PDF chat failed"), "PDF chat failed")
    }
  },

  likeCompetitor: async (payload: ApiRequestBody<"/generate/like-competitor", "post">) => {
    try {
      return await apiPost("/generate/like-competitor", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to generate competitor-style content")
    }
  },

  analyseWebsite: async (payload: ApiRequestBody<"/generate/website-ranking/analyse", "post">) => {
    try {
      return await apiPost("/generate/website-ranking/analyse", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to analyse website")
    }
  },

  createWebsitePrompts: async (
    payload: ApiRequestBody<"/generate/website-ranking/create-prompts", "post">
  ) => {
    try {
      return await apiPost("/generate/website-ranking/create-prompts", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to create website prompts")
    }
  },

  checkWebsiteRankings: async (
    payload: ApiRequestBody<"/generate/website-ranking/check-rankings", "post">
  ) => {
    try {
      return await apiPost("/generate/website-ranking/check-rankings", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to check website rankings")
    }
  },

  generateAdvancedAnalysis: async (
    payload: ApiRequestBody<"/generate/website-ranking/advanced-analysis", "post">
  ) => {
    try {
      return await apiPost("/generate/website-ranking/advanced-analysis", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to generate advanced analysis")
    }
  },

  websiteRankingOrchestrator: async (
    payload: ApiRequestBody<"/generate/website-ranking/orchestrator", "post">
  ) => {
    try {
      return await apiPost("/generate/website-ranking/orchestrator", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to run website ranking orchestrator")
    }
  },
}
