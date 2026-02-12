import { humanizeContentGenerator } from "@api/otherApi"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

export const generateHumanizedContent = createAsyncThunk(
  "humanize/generate",
  async ({ content }, { rejectWithValue }) => {
    try {
      const response = await humanizeContentGenerator({ content })
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to generate content")
    }
  }
)

const humanizeSlice = createSlice({
  name: "humanize",
  initialState: {
    loading: false,
    result: null, // Changed from "" to null to store full response object
    error: null,
  },
  reducers: {
    resetHumanizeState: state => {
      state.loading = false
      state.result = null // Changed from "" to null
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(generateHumanizedContent.pending, state => {
        state.loading = true
        state.result = null // Changed from "" to null
        state.error = null
      })
      .addCase(generateHumanizedContent.fulfilled, (state, action) => {
        state.loading = false
        state.result = action.payload // Store full payload object with all fields
      })
      .addCase(generateHumanizedContent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { resetHumanizeState } = humanizeSlice.actions
export default humanizeSlice.reducer
