import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { fetchUserCreditLogs } from "@api/creditLogApi"

export const getCreditLogs = createAsyncThunk(
  "creditLogs/getCreditLogs",
  async (queryParams, { rejectWithValue }) => {
    try {
      const data = await fetchUserCreditLogs(queryParams)
      return data
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || "Failed to fetch credit logs"
      console.error(msg)
      return rejectWithValue(msg)
    }
  }
)

const creditLogsSlice = createSlice({
  name: "creditLogs",
  initialState: {
    logs: [],
    totalLogs: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCreditLogs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCreditLogs.fulfilled, (state, action) => {
        state.loading = false
        state.logs = action.payload.data
        state.totalLogs = action.payload.totalLogs
        state.page = action.payload.page || 1
        state.totalPages = action.payload.totalPages || 1
      })
      .addCase(getCreditLogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default creditLogsSlice.reducer
