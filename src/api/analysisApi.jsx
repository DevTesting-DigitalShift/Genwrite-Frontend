import axiosInstance from "./index"

export const runCompetitiveAnalysis = async ({ blogId, title, content, keywords }) => {
  const response = await axiosInstance.post("/analysis/run", {
    blogId,
    title,
    content,
    keywords,
    contentType: "markdown",
  })
  return response.data
}

export const analyzeKeywords = async (keywords) => {
  const response = await axiosInstance.post("/analysis/keywords", {
    keywords,
  })
  return response.data
}

export const analyzeKeywordsAPI = async (keywords) => {
  const response = await axiosInstance.get("/analysis/keywords", {
    params: { title: keywords.join(",") },
  })
  return response.data
}
