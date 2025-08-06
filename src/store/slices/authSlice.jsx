import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  login,
  signup,
  UserLogout,
  loadUser,
  forgotPasswordAPI,
  resetPasswordAPI,
  loginWithGoogle,
} from "@api/authApi"

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
  async ({ email, password, captchaToken }, { rejectWithValue }) => {
    try {
      const data = await login({ email, password, captchaToken })
      if (data?.token) {
        saveToken(data.token)
        return { user: data.user, token: data.token }
      }
      return rejectWithValue("Invalid login response")
    } catch (err) {
      return rejectWithValue({
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      })
    }
  }
)

// 📝 Signup
export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async ({ email, password, name, captchaToken }, { rejectWithValue }) => {
    try {
      const data = await signup({ email, password, name, captchaToken })
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
    await UserLogout()
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

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async ({ access_token, captchaToken }, { rejectWithValue }) => {
    try {
      const response = await loginWithGoogle({ access_token, captchaToken })

      if (!response.success || !response.token || !response.user) {
        return rejectWithValue("Invalid Google login response")
      }

      // ✅ Save token
      localStorage.setItem("token", response.token)

      return response.user // or return whole response if needed
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
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
    builder
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false
        state.resetMessage = action.payload
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    //Google Login
    builder
      .addCase(googleLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
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
