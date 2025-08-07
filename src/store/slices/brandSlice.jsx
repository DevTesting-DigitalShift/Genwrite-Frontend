import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  createBrandVoice,
  updateBrandVoice,
  getBrands,
  getSiteInfo,
  deleteBrandVoice,
} from "@api/brandApi"
import { message } from "antd"

export const fetchBrands = async () => {
  const brands = await getBrands()
  return brands
}

export const createBrandVoiceThunk = createAsyncThunk(
  "brand/create",
  async ({ payload, onSuccess }, { rejectWithValue, dispatch }) => {
    try {
      const data = await createBrandVoice(payload)
      dispatch(resetSiteInfo()) // Clear siteInfo after create
      message.success("Brand voice created successfully.")
      if (onSuccess) onSuccess(data)
      return data
    } catch (error) {
      console.error("Error creating brand voice:", error)
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const updateBrandVoiceThunk = createAsyncThunk(
  "brand/update",
  async ({ id, payload, onSuccess }, { rejectWithValue, dispatch }) => {
    try {
      const data = await updateBrandVoice(id, payload)
      dispatch(resetSiteInfo()) // Clear siteInfo after update
      message.success("Brand voice updated successfully.")
      if (onSuccess) onSuccess(data)
      return data
    } catch (error) {
      console.error(
        error?.response?.data?.details?.errors?.[0]?.msg || "Failed to update brand voice."
      )
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const deleteBrandVoiceThunk = createAsyncThunk(
  "brand/delete",
  async ({ id }, { rejectWithValue, dispatch }) => {
    try {
      await deleteBrandVoice(id)
      dispatch(resetSiteInfo()) // Clear siteInfo after delete
      message.success("Brand voice deleted successfully.")
      return id
    } catch (error) {
      console.error("Error deleting brand voice:", error)
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchSiteInfo = createAsyncThunk(
  "siteInfo/fetch",
  async (url, { rejectWithValue }) => {
    try {
      const data = await getSiteInfo(url)
      message.success("Site info fetched successfully.")
      return data
    } catch (error) {
      console.error("Error fetching site info:", error)
      message.error(error?.response?.data?.message || "Failed to fetch site info.")
      return rejectWithValue(error?.response?.data?.message || error.message)
    }
  }
)

const brandSlice = createSlice({
  name: "brand",
  initialState: {
    selectedVoice: null,
    loading: false,
    error: null,
    brands: [],
    siteInfo: {
      data: null,
      loading: false,
      error: null,
    },
  },

  reducers: {
    setSelectedVoice: (state, action) => {
      state.selectedVoice = action.payload
    },
    resetSiteInfo: (state) => {
      state.siteInfo = {
        data: null,
        loading: false,
        error: null,
      }
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(createBrandVoiceThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBrandVoiceThunk.fulfilled, (state, action) => {
        state.loading = false
        state.brands.push(action.payload)
        state.selectedVoice = action.payload
      })
      .addCase(createBrandVoiceThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateBrandVoiceThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBrandVoiceThunk.fulfilled, (state, action) => {
        state.loading = false
        state.brands = state.brands.map((brand) =>
          brand._id === action.payload._id ? action.payload : brand
        )
        state.selectedVoice = action.payload
      })
      .addCase(updateBrandVoiceThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deleteBrandVoiceThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteBrandVoiceThunk.fulfilled, (state, action) => {
        state.loading = false
        state.brands = state.brands.filter((b) => b._id !== action.payload)
        if (state.selectedVoice?._id === action.payload) {
          state.selectedVoice = state.brands[0] || null
        }
      })
      .addCase(deleteBrandVoiceThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchSiteInfo.pending, (state) => {
        state.siteInfo.loading = true
        state.siteInfo.error = null
      })
      .addCase(fetchSiteInfo.fulfilled, (state, action) => {
        state.siteInfo.loading = false
        state.siteInfo.data = action.payload
      })
      .addCase(fetchSiteInfo.rejected, (state, action) => {
        state.siteInfo.loading = false
        state.siteInfo.error = action.payload
      })
  },
})

export const { setSelectedVoice, resetSiteInfo } = brandSlice.actions
export default brandSlice.reducer
