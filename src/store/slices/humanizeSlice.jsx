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
    result: "",
    error: null,
  },
  reducers: {
    resetHumanizeState: (state) => {
      state.loading = false
      state.result = ""
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateHumanizedContent.pending, (state) => {
        state.loading = true
        state.result = ""
        state.error = null
      })
      .addCase(generateHumanizedContent.fulfilled, (state, action) => {
        state.loading = false
        state.result = action.payload.rewrittenContent
      })
      .addCase(generateHumanizedContent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { resetHumanizeState } = humanizeSlice.actions
export default humanizeSlice.reducer
