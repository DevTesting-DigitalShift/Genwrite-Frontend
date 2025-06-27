import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { createBrandVoice, updateBrandVoice, getBrands } from "@api/brandApi"
import { deleteBrandVoice } from "@api/brandApi"
import { message } from "antd"

export const fetchBrands = createAsyncThunk("brand/fetchBrands", async (_, { rejectWithValue }) => {
  try {
    const brands = await getBrands()
    return brands
  } catch (error) {
    message.error("Failed to fetch brand voices.")
    return rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const createBrandVoiceThunk = createAsyncThunk(
  "brand/create",
  async ({ payload, onSuccess }, { rejectWithValue }) => {
    try {
      const data = await createBrandVoice(payload)
      message.success("Brand voice created successfully.")
      if (onSuccess) onSuccess(data)
      return data
    } catch (error) {
      message.error(error?.response?.data?.details?.errors?.[0]?.msg || "Failed to save brand voice.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const updateBrandVoiceThunk = createAsyncThunk(
  "brand/update",
  async ({ id, payload, onSuccess }, { rejectWithValue }) => {
    try {
      const data = await updateBrandVoice(id, payload)
      message.success("Brand voice updated successfully.")
      if (onSuccess) onSuccess(data)
      return data
    } catch (error) {
      message.error(
        error?.response?.data?.details?.errors?.[0]?.msg || "Failed to update brand voice."
      )
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const deleteBrandVoiceThunk = createAsyncThunk(
  "brand/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      await deleteBrandVoice(id)
      message.success("Brand voice deleted successfully.")
      return id
    } catch (error) {
      message.error("Failed to delete brand voice.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const brandSlice = createSlice({
  name: "brand",
  initialState: {
    brands: [],
    selectedVoice: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedVoice: (state, action) => {
      state.selectedVoice = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false
        state.brands = action.payload
        if (!state.selectedVoice && action.payload.length > 0) {
          state.selectedVoice = action.payload[0]
        }
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false
        state.brands = []
        state.error = action.payload
      })
      
      .addCase(createBrandVoiceThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteBrandVoiceThunk.fulfilled, (state, action) => {
        state.loading = false
        state.brands = state.brands.filter((b) => b._id !== action.payload)
        if (state.selectedVoice?._id === action.payload) {
          state.selectedVoice = null
        }
      })
      .addCase(createBrandVoiceThunk.fulfilled, (state, action) => {
        state.loading = false
        state.brands.push(action.payload)
        state.selectedVoice = action.payload
      })
  },
})

export const { setSelectedVoice } = brandSlice.actions
export default brandSlice.reducer
