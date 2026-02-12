import axiosInstance from "."

// AI Content Detection
export const detectAiContentApi = async payload => {
  const response = await axiosInstance.post("/generate/detect-ai", payload)
  return response.data
}

// Keyword Scraping
export const scrapeKeywordsApi = async payload => {
  const response = await axiosInstance.post("/generate/scrape-keywords", payload)
  return response.data
}

// YouTube Summarization
export const summarizeYoutubeApi = async payload => {
  const response = await axiosInstance.post("/generate/youtube-summary", payload)
  return response.data
}

// PDF Chat
export const pdfChatApi = async payload => {
  const config =
    payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
  const response = await axiosInstance.post("/generate/pdf-chat", payload, config)
  return response.data
}

// Competitor Like Blog
export const likeCompetitorApi = async payload => {
  const response = await axiosInstance.post("/generate/like-competitor", payload)
  return response.data
}

// Website Ranking - Analyser
export const analyseWebsiteApi = async payload => {
  const response = await axiosInstance.post("/generate/website-ranking/analyse", payload)
  return response.data
}

// Website Ranking - Create Prompts
export const createWebsitePromptsApi = async payload => {
  const response = await axiosInstance.post("/generate/website-ranking/create-prompts", payload)
  return response.data
}

// Website Ranking - Check Rankings
export const checkWebsiteRankingsApi = async payload => {
  const response = await axiosInstance.post("/generate/website-ranking/check-rankings", payload)
  return response.data
}

// Website Ranking - Advanced Analysis
export const generateAdvancedAnalysisApi = async payload => {
  const response = await axiosInstance.post("/generate/website-ranking/advanced-analysis", payload)
  return response.data
}

// Website Ranking - Orchestrator
export const websiteRankingOrchestratorApi = async payload => {
  const response = await axiosInstance.post("/generate/website-ranking/orchestrator", payload)
  return response.data
}
