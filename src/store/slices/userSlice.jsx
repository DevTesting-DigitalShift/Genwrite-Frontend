import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit"
import { getProfile, getTransactions, markNotificationsAsRead, updateUserProfile } from "@api/userApi"
import { message } from "antd"

// Thunk to fetch user profile
export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getProfile()
      return data
    } catch (error) {
      message.error("Failed to fetch user profile")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Thunk to mark notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  "user/markAllNotificationsAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await markNotificationsAsRead()
      return response.updatedNotifications || []
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to mark notifications as read.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchTransactions = createAsyncThunk(
  "user/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getTransactions()
      return data || []
    } catch (error) {
      message.error("Failed to fetch transactions")
      console.error("Error fetching transactions:", error)
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const data = await updateUserProfile(payload)
      dispatch(fetchUserProfile()) // refetch profile after update
      return data
    } catch (error) {
      message.error("Error updating profile, try again")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const UserThunks = [fetchUserProfile, markAllNotificationsAsRead, fetchTransactions, updateProfile]

const initialState = {
  profile: null,
  loading: false,
  error: null,
  transactions: [],
  items: [],
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.loading = false
        if (state.profile?.notifications) {
          state.profile.notifications = state.profile.notifications.map((n) => ({
            ...n,
            read: true,
          }))
        }
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      // Handle transactions fetching
      .addMatcher(isAnyOf(...UserThunks.map((t) => t.pending)), (state) => {
        state.loading = true
        state.error = null
      })
      .addMatcher(isAnyOf(...UserThunks.map((t) => t.rejected)), (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearUserProfile } = userSlice.actions
export default userSlice.reducer
