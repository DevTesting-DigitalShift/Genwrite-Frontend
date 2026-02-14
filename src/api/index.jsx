import axios from "axios"

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

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    const status = error.response ? error.response.status : null

    // Only delete token for 401 Unauthorized
    if (status === 401) {
      console.warn(`Token removed due to HTTP ${status}`)
      localStorage.removeItem("token")

      // Redirect to login handled below
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
