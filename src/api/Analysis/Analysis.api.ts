// src/api/Analysis/Analysis.api.ts
import { apiGet, apiPost, rethrow, toApiRequestError } from "@api/typedClient"
import axiosInstance from "@api/index"

// The backend validates contentType against a case-sensitive enum
// (analysis.validator.js: z.enum(["MARKDOWN", "HTML", "PLAIN_TEXT"])), so callers
// passing a lowercase value are normalized here rather than at every call site.
export type ContentType = "MARKDOWN" | "HTML" | "PLAIN_TEXT"

// Spelled out rather than upper-casing, because the lowercase spellings used across
// the UI don't all map by case alone — "plain text" would become "PLAIN TEXT", which
// the enum rejects.
const CONTENT_TYPES: Record<string, ContentType> = {
  markdown: "MARKDOWN",
  html: "HTML",
  plain_text: "PLAIN_TEXT",
  "plain text": "PLAIN_TEXT",
  text: "PLAIN_TEXT",
}

const toContentType = (value: unknown): ContentType =>
  CONTENT_TYPES[
    String(value ?? "")
      .trim()
      .toLowerCase()
  ] ?? "MARKDOWN"

interface CompetitiveAnalysisPayload {
  blogId: string
  // Backend requires these (AnalyzeCompetitorsBody) — always send real values.
  title: string
  content: string
  keywords: string[]
  contentType?: string
}

export const AnalysisAPI = {
  runCompetitiveAnalysis: async ({
    blogId,
    title,
    content,
    keywords,
    contentType,
  }: CompetitiveAnalysisPayload) => {
    try {
      return await apiPost("/analysis/run", {
        blogId,
        title,
        content,
        keywords,
        contentType: toContentType(contentType),
      })
    } catch (err) {
      return rethrow(err, "Failed to fetch competitive analysis")
    }
  },

  analyzeKeywords: async (keywords: string[]) => {
    try {
      return await apiPost("/analysis/keywords", { keywords })
    } catch (err) {
      return rethrow(err, "Failed to analyze keywords")
    }
  },

  // Third-party autocomplete endpoint, not part of the backend's OpenAPI surface — stays
  // on plain axios rather than the typed client.
  fetchGoogleSuggestions: async (query: string) => {
    try {
      const response = await axiosInstance.get(
        "https://suggestqueries.google.com/complete/search",
        { params: { client: "firefox", q: query } }
      )
      return response.data[1] || []
    } catch (rawError) {
      // Third-party endpoint — its error body won't match our backend's ErrorResponse
      // shape, so this degrades to a generic message rather than real .code/.details.
      return rethrow(
        toApiRequestError(rawError, "Failed to fetch suggestions"),
        "Failed to fetch suggestions"
      )
    }
  },

  // GET /blogs/status takes no documented query params (schema has query: never) — any
  // params passed here are silently ignored server-side, a pre-existing quirk this
  // migration didn't introduce. Flagged, not fixed: same shape as Payments.api.ts's
  // createPortalSession comment.
  getBlogStatus: async (params?: Record<string, unknown>) => {
    try {
      return await apiGet("/blogs/status", { query: params as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch blog status")
    }
  },
}
