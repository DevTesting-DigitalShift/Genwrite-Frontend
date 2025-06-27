// src/store/slices/analysisSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { analyzeKeywords, analyzeKeywordsAPI, runCompetitiveAnalysis } from "@api/analysisApi"
import { toast } from "react-toastify"

export const fetchCompetitiveAnalysisThunk = createAsyncThunk(
  "analysis/fetchCompetitive",
  async ({ blogId, title, content, keywords }, { rejectWithValue }) => {
    try {
      const data = await runCompetitiveAnalysis({ blogId, title, content, keywords })
      toast.success("Competitive analysis completed successfully!")
      return data
    } catch (error) {
      toast.error("Failed to fetch competitive analysis.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const analyzeKeywordsThunk = createAsyncThunk(
  "analysis/keywords",
  async (keywords, { rejectWithValue }) => {
    try {
      const result = await analyzeKeywords(keywords)
      return result
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to analyze keywords.")
      return rejectWithValue(err?.response?.data?.message || err.message)
    }
  }
)

export const fetchKeywordAnalysis = createAsyncThunk(
  "analysis/fetchKeywordAnalysis",
  async (keywords, { rejectWithValue }) => {
    try {
      const data = await analyzeKeywordsAPI(keywords)
      return data
    } catch (error) {
      const message = error?.response?.data?.message || error.message
      toast.error(message || "Failed to analyze keywords.")
      return rejectWithValue(message)
    }
  }
)

const analysisSlice = createSlice({
  name: "analysis",
  initialState: {
    keywordResult: null,
    loading: false,
    analyzing: false,
    result: null,
    error: null,
  },
  reducers: {
    clearAnalysis: (state) => {
      state.result = null
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
        state.keywordResult = action.payload
      })
      .addCase(analyzeKeywordsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(fetchKeywordAnalysis.pending, (state) => {
        state.analyzing = true
        state.error = null
        state.keywordResult = null
      })
      .addCase(fetchKeywordAnalysis.fulfilled, (state, action) => {
        state.analyzing = false
        state.keywordResult = action.payload
      })
      .addCase(fetchKeywordAnalysis.rejected, (state, action) => {
        state.analyzing = false
        state.error = action.payload
      })
  },
})

export const { clearAnalysis, clearKeywordAnalysis } = analysisSlice.actions
export default analysisSlice.reducer
