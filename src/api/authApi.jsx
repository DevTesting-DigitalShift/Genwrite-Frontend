import axiosInstance from "."

// Utility function to retry API calls
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error // Throw on last retry
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i))) // Exponential backoff
    }
  }
}

export const login = async (email, password) => {
  const response = await axiosInstance.post("/auth/login", { email, password })
  return response.data
}

export const signup = async (email, password, name) => {
  const response = await axiosInstance.post("/auth/register", {
    email,
    password,
    name,
  })
  return response.data
}

export const UserLogout = async () => {
  const response = await axiosInstance.get(`/auth/logout`)
  localStorage.removeItem("token") // Clear token on logout
  return response.data
}

export const loadUser = async (navigate) => {
  // Check if token exists before making API call
  const token = localStorage.getItem("token")
  if (!token) {
    navigate("/login")
    throw new Error("No authentication token found")
  }

  try {
    // Retry the API call up to 3 times with exponential backoff
    const response = await retry(() => axiosInstance.get(`/auth/me`), 3, 1000)
    return response.data
  } catch (error) {
    const status = error?.response?.status
    const isNetworkError = error?.code === "ERR_NETWORK"

    if (status === 401 || status === 403) {
      // Unauthorized or Forbidden: Clear token and redirect to login
      localStorage.removeItem("token")
      navigate("/login")
      throw new Error("Session expired. Please log in again.")
    } else if (isNetworkError) {
      // Network error: Show user-friendly message without redirecting
      console.error("Network error: Backend server not reachable")
      throw new Error("Unable to connect to the server. Please try again later.")
    } else {
      // Other errors: Log and throw without redirecting
      console.error("Auth Error:", error.response?.data || error.message)
      throw new Error("User loading failed")
    }
  }
}

export const forgotPasswordAPI = async (email) => {
  const response = await axiosInstance.post("/auth/forgot-password", { email })
  return response.data
}

export const resetPasswordAPI = async (token, newPassword) => {
  const response = await axiosInstance.post("/auth/reset-password", { token, newPassword })
  return response.data
}

export const loginWithGoogle = async (access_token) => {
  try {
    const response = await axiosInstance.post("/auth/google-signin", {
      access_token,
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Google login failed")
  }
}