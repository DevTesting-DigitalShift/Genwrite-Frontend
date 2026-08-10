import axios from "axios"
import { toast } from "sonner"
import useWorkspaceStore from "@store/useWorkspaceStore"

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1`, // Replace with your API base URL
  headers: { "Content-Type": "application/json" },
})

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    }
    // Add JWT token if available
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Scope reads to a shared workspace, if one is currently active
    const { activeWorkspace } = useWorkspaceStore.getState()
    if (activeWorkspace) {
      config.headers["X-Watch-As"] = activeWorkspace.id
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Local state for toast throttling
let last429Toast = 0

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const status = error.response ? error.response.status : null

    // 1. Throttled 429 Too Many Requests
    if (status === 429) {
      const now = Date.now()
      if (now - last429Toast > 5000) {
        toast.error("Too many requests. Please try after some time.")
        last429Toast = now
      }
    }

    // 2. Read-only workspace write attempt — surface the backend's message as a safety net
    //    for any write action we didn't proactively gate in the UI.
    if (status === 403 && error.response?.data?.message?.includes("Read-only access")) {
      toast.error(error.response.data.message)
    }

    // 3. Only delete token for 401 Unauthorized
    if (status === 401) {
      console.warn(`Token removed due to HTTP ${status}`)
      localStorage.removeItem("token")

      // Detect public blog path to prevent forced redirect
      const isPublicPath =
        window.location.pathname.startsWith("/blog/") &&
        !window.location.pathname.startsWith("/blog-editor")

      if (!isPublicPath && window.location.pathname !== "/login") {
        // Use sonner toast
        toast.error("Session expired. Please login again.")

        // Redirect to login handled below
        setTimeout(() => {
          window.location.href = "/login"
        }, 1500)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
