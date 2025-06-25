import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { login, signup, Userlogout, loadUser, forgotPasswordAPI, resetPasswordAPI } from "@api/authApi"
import { getProfile } from "@api/userApi"

// Utils
const saveToken = (token) => localStorage.setItem("token", token)
const removeToken = () => localStorage.removeItem("token")
const getToken = () => localStorage.getItem("token")

// Initial state
const initialState = {
  user: null,
  token: getToken(),
  loading: false,
  error: null,
  forgotMessage: null,
  resetMessage: null,
}

// 🔐 Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await login(email, password)
      if (data?.token) {
        saveToken(data.token)
        return { user: data.user, token: data.token }
      }
      return rejectWithValue("Invalid login response")
    } catch (err) {
      return rejectWithValue("Login failed")
    }
  }
)

// 📝 Signup
export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async ({ email, password, name }, { rejectWithValue }) => {
    try {
      const data = await signup(email, password, name)
      if (data?.token) {
        saveToken(data.token)
        return { user: data.user, token: data.token }
      }
      return rejectWithValue("Invalid signup response")
    } catch (err) {
      return rejectWithValue("Signup failed")
    }
  }
)

// 🧠 Load User from token
export const loadAuthenticatedUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return rejectWithValue("No token found")

    try {
      const data = await loadUser() // Or getProfile()
      if (data?.success && data?.user) {
        return { user: data.user, token }
      }
      return rejectWithValue("Failed to load user")
    } catch (err) {
      return rejectWithValue("User loading failed")
    }
  }
)

// 📤 Logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { dispatch }) => {
  try {
    await Userlogout()
  } catch (err) {
    console.warn("Logout failed (ignored)", err)
  }
  dispatch(logout())
})

// 🔁 Forgot Password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const data = await forgotPasswordAPI(email)
      return data // or success flag
    } catch (err) {
      console.error("Forgot password error:", err)
      return rejectWithValue(err.response?.data?.error || "Failed to send reset link")
    }
  }
)

// 🔁 Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const data = await resetPasswordAPI(token, newPassword)
      return data.message // or success flag
    } catch (err) {
      console.error("Reset password error:", err)
      return rejectWithValue(err.response?.data?.error || "Failed to reset password")
    }
  }
)

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      removeToken()
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.token = action.payload.token
    })
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Signup
    builder.addCase(signupUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(signupUser.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.token = action.payload.token
    })
    builder.addCase(signupUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Load Authenticated User
    builder.addCase(loadAuthenticatedUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loadAuthenticatedUser.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.token = action.payload.token
    })
    builder.addCase(loadAuthenticatedUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Logout (doesn't have async states)
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null
      state.token = null
      state.loading = false
    })
    // Forgot Password
    builder.addCase(forgotPassword.pending, (state) => {
      state.loading = true
      state.error = null
      state.forgotMessage = null
    })
    builder.addCase(forgotPassword.fulfilled, (state, action) => {
      state.loading = false
      state.forgotMessage = action.payload
    })
    builder.addCase(forgotPassword.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Reset Password
    builder.addCase(resetPassword.pending, (state) => {
      state.loading = true
      state.error = null
      state.resetMessage = null
    })
    builder.addCase(resetPassword.fulfilled, (state, action) => {
      state.loading = false
      state.resetMessage = action.payload
    })
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer

// 📦 Selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
