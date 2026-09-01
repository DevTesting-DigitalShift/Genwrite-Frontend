import axiosInstance from "."
import { getActiveSession, removeSession } from "@utils/sessionStore"

const removeActiveSession = () => {
  const active = getActiveSession()
  // Auth failure, not a deliberate sign-out — detach this tab rather than letting it
  // adopt whichever other account is signed in on this browser.
  if (active) removeSession(active.userId, { adoptNext: false })
}

export const getIP = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json")
    const { ip } = await res.json()
    return ip
  } catch (err) {
    console.error("IP Fecth Error", err)
    return ""
  }
}

// Utility function to retry API calls
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error // Throw on last retry
      await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i)) // Exponential backoff
    }
  }
}

export const login = async (reqBody) => {
  try {
    reqBody.ip = await getIP()
    const response = await axiosInstance.post("/auth/login", reqBody)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed")
  }
}

export const signup = async (body) => {
  try {
    body.ip = await getIP()
    const response = await axiosInstance.post("/auth/register", body)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Signup failed")
  }
}
export const UserLogout = async () => {
  // Session removal from storage is owned by useAuthStore.logoutUser (via
  // sessionStore), which calls this first — this function only hits the backend.
  const response = await axiosInstance.get(`/auth/logout`)
  return response.data
}

export const loadUser = async (navigate) => {
  // Check if a session exists before making the API call — the access token itself
  // now lives only in memory and is refreshed separately; this just checks there's
  // an account to try authenticating.
  const session = getActiveSession()
  if (!session) {
    navigate("/login")
    throw new Error("No authentication token found")
  }

  try {
    // Retry the API call up to 3 times with exponential backoff
    const response = await retry(() => axiosInstance.get(`/auth/me`), 2, 250)
    return response.data
  } catch (error) {
    const status = error?.response?.status
    const isNetworkError = error?.code === "ERR_NETWORK"

    if (status === 401 || status === 403) {
      // Unauthorized or Forbidden: Clear token and redirect to login
      removeActiveSession()
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

export const loginWithGoogle = async (body) => {
  try {
    const response = await axiosInstance.post("/auth/google-signin", body)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Google login failed")
  }
}

export const refreshSession = async (userId) => {
  const response = await axiosInstance.post("/auth/refresh", { userId })
  return response.data
}

export const logoutAllDevicesAPI = async () => {
  const response = await axiosInstance.post(`/auth/logout-all`)
  return response.data
}
