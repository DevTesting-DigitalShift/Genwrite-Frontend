import axiosInstance from "./index"

interface CompetitiveAnalysisPayload {
  blogId: string
  title?: string
  content?: string
  keywords?: string[]
}

export const runCompetitiveAnalysis = async ({
  blogId,
  title,
  content,
  keywords,
}: CompetitiveAnalysisPayload) => {
  const response = await axiosInstance.post("/analysis/run", {
    blogId,
    title,
    content,
    keywords,
    contentType: "markdown",
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
