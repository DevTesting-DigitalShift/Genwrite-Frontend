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

      // Use toast store directly if possible or import it.
      // Since this is a non-React file, we can import the store directly.
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Session expired. Please login again.", type: "alert-error" },
        })
      )

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
