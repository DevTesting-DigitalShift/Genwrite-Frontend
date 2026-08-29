import axiosInstance from "./index"

// The API validates contentType against an uppercase enum, so map the lowercase
// values used across the UI onto it before sending.
const CONTENT_TYPES = {
  markdown: "MARKDOWN",
  html: "HTML",
  plain_text: "PLAIN_TEXT",
  "plain text": "PLAIN_TEXT",
  text: "PLAIN_TEXT",
}

const toContentType = (value) =>
  CONTENT_TYPES[String(value ?? "").trim().toLowerCase()] ?? "MARKDOWN"

export const runCompetitiveAnalysis = async ({
  blogId,
  title,
  content,
  keywords,
  contentType,
}) => {
  const response = await axiosInstance.post("/analysis/run", {
    blogId,
    title,
    content,
    keywords,
    contentType: toContentType(contentType),
  })
  return response.data
}

export const analyzeKeywords = async (keywords) => {
  const response = await axiosInstance.post("/analysis/keywords", { keywords })
  return response.data
}

export const fetchGoogleSuggestions = async (query) => {
  const response = await axiosInstance.get("https://suggestqueries.google.com/complete/search", {
    params: { client: "firefox", q: query },
  })
  return response.data[1] || []
}

export const getBlogStatus = async (params) => {
  const response = await axiosInstance.get("/blogs/status", { params })
  return response.data
}
