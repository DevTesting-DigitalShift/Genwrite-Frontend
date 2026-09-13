/**
 * Every `/generate/*` endpoint (AI content generation + website-ranking tools), consolidated
 * out of the otherApi.ts/toolsApi.ts grab-bags. `/generate/title` stays in blogApi.ts
 * (getGeneratedTitles) — it's blog-creation-specific and already lived there.
 */
import { apiPost, rethrow } from "./typedClient"
import axiosInstance from "."

export const humanizeContentGenerator = async (payload: unknown) => {
  try {
    return await apiPost("/generate/humanised-content", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to humanize content")
  }
}

export const createOutline = async (payload: unknown) => {
  try {
    return await apiPost("/generate/outline", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create outline")
  }
}

export const generateMetadata = async (payload: unknown) => {
  try {
    return await apiPost("/generate/metadata", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to generate metadata")
  }
}

/** Generate blog content with custom prompt. */
export const generatePromptContent = async ({
  prompt,
  content,
}: {
  prompt: string
  content?: string
}) => {
  try {
    return await apiPost("/generate/prompt-content", { prompt, content: content ?? "" })
  } catch (err) {
    return rethrow(err, "Failed to generate prompt content")
  }
}

/** AI content detection ("is this AI-written?"). */
export const detectAiContentApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/detect-ai", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to detect AI content")
  }
}

export const scrapeKeywordsApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/scrape-keywords", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to scrape keywords")
  }
}

export const summarizeYoutubeApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/youtube-summary", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to summarize video")
  }
}

/**
 * PDF Chat — the request body is genuinely multipart/form-data on the backend
 * (chatWithPDFSchema), not expressible as a typed JSON requestBody, so this stays on plain
 * axios rather than the typed client — same pattern as blogApi.ts's createBlog.
 */
export const pdfChatApi = async (payload: unknown) => {
  const config =
    payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
  const response = await axiosInstance.post("/generate/pdf-chat", payload, config)
  return response.data
}

export const likeCompetitorApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/like-competitor", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to generate competitor-style content")
  }
}

export const analyseWebsiteApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/website-ranking/analyse", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to analyse website")
  }
}

export const createWebsitePromptsApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/website-ranking/create-prompts", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create website prompts")
  }
}

export const checkWebsiteRankingsApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/website-ranking/check-rankings", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to check website rankings")
  }
}

export const generateAdvancedAnalysisApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/website-ranking/advanced-analysis", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to generate advanced analysis")
  }
}

export const websiteRankingOrchestratorApi = async (payload: unknown) => {
  try {
    return await apiPost("/generate/website-ranking/orchestrator", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to run website ranking orchestrator")
  }
}
