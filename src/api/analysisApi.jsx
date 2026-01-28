import axiosInstance from "./index";

export const runCompetitiveAnalysis = async ({ blogId, title, content, keywords }) => {
  const response = await axiosInstance.post("/analysis/run", {
    blogId,
    title,
    content,
    keywords,
    contentType: "markdown",
  });
  return response.data;
};

export const analyzeKeywords = async (keywords) => {
  const response = await axiosInstance.post("/analysis/keywords", {
    keywords,
  });
  return response.data;
};

export const fetchGoogleSuggestions = async (query) => {
  const response = await axiosInstance.get("https://suggestqueries.google.com/complete/search", {
    params: {
      client: "firefox",
      q: query,
    },
  });
  return response.data[1] || [];
};

export const getBlogStatus = async (params) => {
  const response = await axiosInstance.get("/blogs/status", { params });
  return response.data;
};