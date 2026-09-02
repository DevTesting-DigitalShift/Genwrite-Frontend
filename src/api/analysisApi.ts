import axiosInstance from "./index"

// The backend validates contentType against a case-sensitive enum
// (analysis.validator.js: z.enum(["MARKDOWN", "HTML", "PLAIN_TEXT"])), so callers
// passing a lowercase value are normalized here rather than at every call site.
export type ContentType = "MARKDOWN" | "HTML" | "PLAIN_TEXT"

interface CompetitiveAnalysisPayload {
  blogId: string
  title?: string
  content?: string
  keywords?: string[]
  contentType?: string
}

export const runCompetitiveAnalysis = async ({
  blogId,
  title,
  content,
  keywords,
  contentType = "MARKDOWN",
}: CompetitiveAnalysisPayload) => {
  const response = await axiosInstance.post("/analysis/run", {
    blogId,
    title,
    content,
    keywords,
    contentType: String(contentType).toUpperCase() as ContentType,
  })
  return response.data
}

export const analyzeKeywords = async (keywords: string[]) => {
  const response = await axiosInstance.post("/analysis/keywords", { keywords })
  return response.data
}

export const fetchGoogleSuggestions = async (query: string) => {
  const response = await axiosInstance.get("https://suggestqueries.google.com/complete/search", {
    params: { client: "firefox", q: query },
  })
  return response.data[1] || []
}

export const getBlogStatus = async (params?: Record<string, unknown>) => {
  const response = await axiosInstance.get("/blogs/status", { params })
  return response.data
}
