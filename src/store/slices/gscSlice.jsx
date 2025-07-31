import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getVerifiedSites, getGscAnalytics, connectGsc, getGscAuthUrl } from "@/api/gscApi"

export const fetchVerifiedSites = createAsyncThunk(
  "gsc/fetchVerifiedSites",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getVerifiedSites()
      // Since backend doesn't return sites directly, we may need to derive from /gsc/data or user data
      // For now, return empty array or fetch from another endpoint if added
      return data
    } catch (error) {
      return rejectWithValue(error || "Failed to fetch verified sites")
    }
  }
)

export const fetchGscAnalytics = createAsyncThunk(
  "gsc/fetchGscAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      const data = await getGscAnalytics(params)
      return data 
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const connectGscAccount = createAsyncThunk(
  "gsc/connectGscAccount",
  async ({ code, state }, { rejectWithValue }) => {
    try {
      const data = await connectGsc({ code, state })
      return data
    } catch (error) {
      return rejectWithValue(error || "Failed to connect GSC")
    }
  }
)

export const fetchGscAuthUrl = createAsyncThunk(
  "gsc/fetchGscAuthUrl",
  async (_, { rejectWithValue }) => {
    try {
      const url = await getGscAuthUrl()
      return url
    } catch (error) {
      return rejectWithValue(error || "Failed to get auth URL")
    }
  }
)

const gscSlice = createSlice({
  name: "gsc",
  initialState: {
    verifiedSites: [], // Will need backend endpoint to fetch verified sites
    analyticsData: [],
    gscAuthUrl: null,
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
        state.verifiedSites = action.payload || []
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
        state.analyticsData = action.payload || []
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
      .addCase(fetchGscAuthUrl.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGscAuthUrl.fulfilled, (state, action) => {
        state.loading = false
        state.gscAuthUrl = action.payload
      })
      .addCase(fetchGscAuthUrl.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearAnalytics } = gscSlice.actions
export default gscSlice.reducer