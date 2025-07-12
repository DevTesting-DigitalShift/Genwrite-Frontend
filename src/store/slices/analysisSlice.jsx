// src/store/slices/analysisSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { analyzeKeywords, fetchGoogleSuggestions, runCompetitiveAnalysis } from "@api/analysisApi"
import { message } from "antd"

export const fetchCompetitiveAnalysisThunk = createAsyncThunk(
  "analysis/fetchCompetitive",
  async ({ blogId, title, content, keywords }, { rejectWithValue }) => {
    try {
      const data = await runCompetitiveAnalysis({ blogId, title, content, keywords })
      message.success("Competitive analysis completed successfully!")
      return data
    } catch (error) {
      console.error("Competitive analysis error", error)
      message.error(error.response?.data?.message || "Failed to fetch competitive analysis.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const analyzeKeywordsThunk = createAsyncThunk(
  "analysis/analyzeKeywords",
  async (keywords, { rejectWithValue }) => {
    try {
      const result = await analyzeKeywords(keywords)
      return result
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to analyze keywords.")
      return rejectWithValue(err?.response?.data?.message || err.message)
    }
  }
)

export const fetchKeywordSuggestions = createAsyncThunk(
  "analysis/fetchSuggestions",
  async (query, { rejectWithValue }) => {
    try {
      const suggestions = await fetchGoogleSuggestions(query)
      return suggestions
    } catch (error) {
      console.error("error", error)
      return rejectWithValue("Failed to fetch suggestions")
    }
  }
)

const analysisSlice = createSlice({
  name: "analysis",
  initialState: {
    keywordAnalysis: [],
    suggestions: [],
    loading: false,
    analyzing: false,
    result: null,
    error: null,
    selectedKeywords: [],
  },
  reducers: {
    clearAnalysis: (state) => {
      state.result = null
      state.error = null
    },
    setSelectedKeywords: (state, action) => {
      state.selectedKeywords = action.payload
    },
    clearKeywordAnalysis: (state) => {
      state.keywordAnalysis = null
      state.selectedKeywords = []
    },
    clearSuggestions: (state) => {
      state.suggestions = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompetitiveAnalysisThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCompetitiveAnalysisThunk.fulfilled, (state, action) => {
        state.loading = false
        state.result = action.payload
      })
      .addCase(fetchCompetitiveAnalysisThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(analyzeKeywordsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(analyzeKeywordsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.keywordAnalysis = action.payload
      })
      .addCase(analyzeKeywordsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(fetchKeywordSuggestions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchKeywordSuggestions.fulfilled, (state, action) => {
        state.loading = false
        state.suggestions = action.payload
      })
      .addCase(fetchKeywordSuggestions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearAnalysis, clearKeywordAnalysis, setSelectedKeywords, clearSuggestions } =
  analysisSlice.actions
export default analysisSlice.reducer
