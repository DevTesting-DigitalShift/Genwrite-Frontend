import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { getIntegrationById, getCategories, createIntegration, updateIntegration } from "@/api/integrationApi"

export const fetchIntegrationById = createAsyncThunk(
  "integrations/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await getIntegrationById(id)
      return res
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const fetchCategories = createAsyncThunk(
  "integrations/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCategories()
      return res
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const createNewIntegration = createAsyncThunk(
  "integrations/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createIntegration(payload)
      return res
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const updateExistingIntegration = createAsyncThunk(
  "integrations/update",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await updateIntegration(payload)
      return res
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// 🧩 Slice
const integrationSlice = createSlice({
  name: "integration",
  initialState: {
    integrations: [],
    currentIntegration: null,
    categories: [],
    ping: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🔹 Fetch single post
      .addCase(fetchIntegrationById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchIntegrationById.fulfilled, (state, action) => {
        state.loading = false
        state.currentIntegration = action.payload
      })
      .addCase(fetchIntegrationById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // 🔹 Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // 🔹 Create post
      .addCase(createNewIntegration.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createNewIntegration.fulfilled, (state, action) => {
        state.loading = false
        state.integrations.push(action.payload)
      })
      .addCase(createNewIntegration.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // 🔹 Update post
      .addCase(updateExistingIntegration.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateExistingIntegration.fulfilled, (state, action) => {
        state.loading = false
        const updatedIntegration = action.payload
        const index = state.integrations.findIndex((p) => p.id === updatedIntegration.id)
        if (index !== -1) {
          state.integrations[index] = updatedIntegration
        }
      })
      .addCase(updateExistingIntegration.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default integrationSlice.reducer
