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

const initialState = {
  aiDetection: { loading: false, result: null, error: null },
  keywordScraping: { loading: false, result: null, error: null },
  youtubeSummary: { loading: false, result: null, error: null },
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
  },
})

export const { resetAiDetection, resetKeywordScraping, resetYoutubeSummary } = toolsSlice.actions
export default toolsSlice.reducer
