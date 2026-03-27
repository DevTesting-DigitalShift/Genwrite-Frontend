import axios from "axios"
import { toast } from "sonner"

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1`, // Replace with your API base URL
  headers: { "Content-Type": "application/json" },
})

// Add request interceptor
axiosInstance.interceptors.request.use(
  config => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    }
    // Add JWT token if available
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Local state for toast throttling
let last429Toast = 0

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    const status = error.response ? error.response.status : null

    // 1. Throttled 429 Too Many Requests
    if (status === 429) {
      const now = Date.now()
      if (now - last429Toast > 5000) {
        toast.error("Too many requests. Please try after some time.")
        last429Toast = now
      }
    }

    // 2. Only delete token for 401 Unauthorized
    if (status === 401) {
      console.warn(`Token removed due to HTTP ${status}`)
      localStorage.removeItem("token")

      // Use sonner toast
      toast.error("Session expired. Please login again.")

      // Redirect to login handled below
      if (window.location.pathname !== "/login") {
        setTimeout(() => {
          window.location.href = "/login"
        }, 1500)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
