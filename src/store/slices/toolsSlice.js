import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axiosInstance from "@/api"

// AI Content Detection
export const detectAiContent = createAsyncThunk(
  "tools/detectAiContent",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/detect-ai", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Keyword Scraping
export const scrapeKeywords = createAsyncThunk(
  "tools/scrapeKeywords",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/scrape-keywords", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// YouTube Summarization
export const summarizeYoutube = createAsyncThunk(
  "tools/summarizeYoutube",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/youtube-summary", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)
// PDF Chat
export const pdfChat = createAsyncThunk("tools/pdfChat", async (payload, { rejectWithValue }) => {
  try {
    // Handle FormData payloads (file uploads)
    const config =
      payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}

    const response = await axiosInstance.post("/generate/pdf-chat", payload, config)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})

// Competitor Like Blog
export const likeCompetitor = createAsyncThunk(
  "tools/likeCompetitor",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/like-competitor", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Website Ranking Thunks
export const analyseWebsite = createAsyncThunk(
  "tools/analyseWebsite",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/website-ranking/analyse", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const createWebsitePrompts = createAsyncThunk(
  "tools/createWebsitePrompts",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/website-ranking/create-prompts", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const checkWebsiteRankings = createAsyncThunk(
  "tools/checkWebsiteRankings",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/website-ranking/check-rankings", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const generateAdvancedAnalysis = createAsyncThunk(
  "tools/generateAdvancedAnalysis",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/generate/website-ranking/advanced-analysis",
        payload
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const websiteRankingOrchestrator = createAsyncThunk(
  "tools/websiteRankingOrchestrator",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate/website-ranking/orchestrator", payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const initialState = {
  aiDetection: { loading: false, result: null, error: null },
  keywordScraping: { loading: false, result: null, error: null },
  youtubeSummary: { loading: false, result: null, error: null },
  pdfChat: { loading: false, result: null, error: null, cacheKey: null, messages: [] },
  competitorLikeBlog: { loading: false, result: null, error: null },
  websiteRanking: {
    analyser: { loading: false, result: null, error: null },
    prompts: { loading: false, result: null, error: null },
    rankings: { loading: false, result: null, error: null },
    advancedComp: { loading: false, result: null, error: null },
    orchestrator: { loading: false, result: null, error: null },
  },
}

const toolsSlice = createSlice({
  name: "tools",
  initialState,
  reducers: {
    resetAiDetection: state => {
      state.aiDetection = initialState.aiDetection
    },
    resetKeywordScraping: state => {
      state.keywordScraping = initialState.keywordScraping
    },
    resetYoutubeSummary: state => {
      state.youtubeSummary = initialState.youtubeSummary
    },
    resetPdfChat: state => {
      state.pdfChat = initialState.pdfChat
    },
    addPdfChatMessage: (state, action) => {
      state.pdfChat.messages.push(action.payload)
    },
    resetCompetitorLikeBlog: state => {
      state.competitorLikeBlog = initialState.competitorLikeBlog
    },
    resetWebsiteRanking: state => {
      state.websiteRanking = initialState.websiteRanking
    },
  },
  extraReducers: builder => {
    // AI Detection
    builder
      .addCase(detectAiContent.pending, state => {
        state.aiDetection.loading = true
        state.aiDetection.error = null
      })
      .addCase(detectAiContent.fulfilled, (state, action) => {
        state.aiDetection.loading = false
        state.aiDetection.result = action.payload
      })
      .addCase(detectAiContent.rejected, (state, action) => {
        state.aiDetection.loading = false
        state.aiDetection.error = action.payload
      })

    // Keyword Scraping
    builder
      .addCase(scrapeKeywords.pending, state => {
        state.keywordScraping.loading = true
        state.keywordScraping.error = null
      })
      .addCase(scrapeKeywords.fulfilled, (state, action) => {
        state.keywordScraping.loading = false
        state.keywordScraping.result = action.payload
      })
      .addCase(scrapeKeywords.rejected, (state, action) => {
        state.keywordScraping.loading = false
        state.keywordScraping.error = action.payload
      })

    // YouTube Summary
    builder
      .addCase(summarizeYoutube.pending, state => {
        state.youtubeSummary.loading = true
        state.youtubeSummary.error = null
      })
      .addCase(summarizeYoutube.fulfilled, (state, action) => {
        state.youtubeSummary.loading = false
        state.youtubeSummary.result = action.payload
      })
      .addCase(summarizeYoutube.rejected, (state, action) => {
        state.youtubeSummary.loading = false
        state.youtubeSummary.error = action.payload
      })

    // PDF Chat
    builder
      .addCase(pdfChat.pending, state => {
        state.pdfChat.loading = true
        state.pdfChat.error = null
      })
      .addCase(pdfChat.fulfilled, (state, action) => {
        state.pdfChat.loading = false
        state.pdfChat.result = action.payload
        // Save cacheKey for subsequent requests
        if (action.payload.cacheKey) {
          state.pdfChat.cacheKey = action.payload.cacheKey
        }
      })
      .addCase(pdfChat.rejected, (state, action) => {
        state.pdfChat.loading = false
        state.pdfChat.error = action.payload
      })

    // Competitor Like Blog
    builder
      .addCase(likeCompetitor.pending, state => {
        state.competitorLikeBlog.loading = true
        state.competitorLikeBlog.error = null
      })
      .addCase(likeCompetitor.fulfilled, (state, action) => {
        state.competitorLikeBlog.loading = false
        state.competitorLikeBlog.result = action.payload
      })
      .addCase(likeCompetitor.rejected, (state, action) => {
        state.competitorLikeBlog.loading = false
        state.competitorLikeBlog.error = action.payload
      })

    // Website Ranking - Analyser
    builder
      .addCase(analyseWebsite.pending, state => {
        state.websiteRanking.analyser.loading = true
        state.websiteRanking.analyser.error = null
      })
      .addCase(analyseWebsite.fulfilled, (state, action) => {
        state.websiteRanking.analyser.loading = false
        state.websiteRanking.analyser.result = action.payload
      })
      .addCase(analyseWebsite.rejected, (state, action) => {
        state.websiteRanking.analyser.loading = false
        state.websiteRanking.analyser.error = action.payload
      })

    // Website Ranking - Create Prompts
    builder
      .addCase(createWebsitePrompts.pending, state => {
        state.websiteRanking.prompts.loading = true
        state.websiteRanking.prompts.error = null
      })
      .addCase(createWebsitePrompts.fulfilled, (state, action) => {
        state.websiteRanking.prompts.loading = false
        state.websiteRanking.prompts.result = action.payload
      })
      .addCase(createWebsitePrompts.rejected, (state, action) => {
        state.websiteRanking.prompts.loading = false
        state.websiteRanking.prompts.error = action.payload
      })

    // Website Ranking - Check Rankings
    builder
      .addCase(checkWebsiteRankings.pending, state => {
        state.websiteRanking.rankings.loading = true
        state.websiteRanking.rankings.error = null
      })
      .addCase(checkWebsiteRankings.fulfilled, (state, action) => {
        state.websiteRanking.rankings.loading = false
        state.websiteRanking.rankings.result = action.payload
      })
      .addCase(checkWebsiteRankings.rejected, (state, action) => {
        state.websiteRanking.rankings.loading = false
        state.websiteRanking.rankings.error = action.payload
      })

    // Website Ranking - Advanced Analysis
    builder
      .addCase(generateAdvancedAnalysis.pending, state => {
        state.websiteRanking.advancedComp.loading = true
        state.websiteRanking.advancedComp.error = null
      })
      .addCase(generateAdvancedAnalysis.fulfilled, (state, action) => {
        state.websiteRanking.advancedComp.loading = false
        state.websiteRanking.advancedComp.result = action.payload
      })
      .addCase(generateAdvancedAnalysis.rejected, (state, action) => {
        state.websiteRanking.advancedComp.loading = false
        state.websiteRanking.advancedComp.error = action.payload
      })

    // Website Ranking - Orchestrator
    builder
      .addCase(websiteRankingOrchestrator.pending, state => {
        state.websiteRanking.orchestrator.loading = true
        state.websiteRanking.orchestrator.error = null
      })
      .addCase(websiteRankingOrchestrator.fulfilled, (state, action) => {
        state.websiteRanking.orchestrator.loading = false
        state.websiteRanking.orchestrator.result = action.payload
      })
      .addCase(websiteRankingOrchestrator.rejected, (state, action) => {
        state.websiteRanking.orchestrator.loading = false
        state.websiteRanking.orchestrator.error = action.payload
      })
  },
})

export const {
  resetAiDetection,
  resetKeywordScraping,
  resetYoutubeSummary,
  resetPdfChat,
  addPdfChatMessage,
  resetCompetitorLikeBlog,
  resetWebsiteRanking,
} = toolsSlice.actions
export default toolsSlice.reducer
