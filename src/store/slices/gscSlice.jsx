// src/store/slices/gscSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getVerifiedSites, getGscAnalytics, connectGsc } from "@/api/gscApi"

export const fetchVerifiedSites = createAsyncThunk(
  "gsc/fetchVerifiedSites",
  async (_, thunkAPI) => {
    try {
      const sites = await getVerifiedSites()
      return sites
    } catch (error) {
      return thunkAPI.rejectWithValue("Failed to fetch verified sites")
    }
  }
)

export const fetchGscAnalytics = createAsyncThunk(
  "gsc/fetchGscAnalytics",
  async (params, thunkAPI) => {
    try {
      const data = await getGscAnalytics(params)
      return data
    } catch (error) {
      return thunkAPI.rejectWithValue("Failed to fetch analytics data")
    }
  }
)

export const connectGscAccount = createAsyncThunk(
  "gsc/connectGscAccount",
  async (code, { rejectWithValue }) => {
    try {
      const data = await connectGsc(code)
      return data
    } catch (err) {
      console.error("GSC connection error:", err)
      return rejectWithValue(
        err.response?.data?.error || "Failed to connect GSC"
      )
    }
  }
)

const gscSlice = createSlice({
  name: "gsc",
  initialState: {
    verifiedSites: [],
    analyticsData: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAnalytics: (state) => {
      state.analyticsData = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerifiedSites.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVerifiedSites.fulfilled, (state, action) => {
        state.loading = false
        state.verifiedSites = action.payload
      })
      .addCase(fetchVerifiedSites.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchGscAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGscAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.analyticsData = action.payload
      })
      .addCase(fetchGscAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(connectGscAccount.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(connectGscAccount.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(connectGscAccount.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearAnalytics } = gscSlice.actions
export default gscSlice.reducer
