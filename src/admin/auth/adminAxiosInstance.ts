import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { getAuthToken, removeAuthToken, setAuthToken } from "./authToken"

/**
 * Admin-specific axios instance — fully separate from the end-user axios
 * instance in @api/index.jsx (own base config, own interceptors, own token
 * storage key). Uses an httpOnly refresh cookie for session renewal.
 */
const adminAxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
})

// ============================================================================
// Token refresh queueing
// ============================================================================

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

const failedQueue: Array<{
  resolve: (value: AxiosResponse) => void
  reject: (error: Error) => void
  config: InternalAxiosRequestConfig
}> = []

const processQueue = (error: Error | null, token: string | null = null): void => {
  for (const request of failedQueue) {
    if (error) {
      request.reject(error)
    } else if (token) {
      if (request.config.headers) {
        request.config.headers.Authorization = `Bearer ${token}`
      }
      adminAxiosInstance(request.config)
        .then((response) => request.resolve(response))
        .catch((err) => request.reject(err))
    }
  }
  failedQueue.length = 0
}

const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post<{ accessToken: string }>(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/auth/refresh`,
      {},
      { withCredentials: true }
    )

    if (!response.data?.accessToken) {
      throw new Error("Invalid refresh response: missing accessToken")
    }

    setAuthToken(response.data.accessToken)
    return response.data.accessToken
  } catch (error) {
    removeAuthToken()
    throw error
  }
}

// ============================================================================
// Request interceptor
// ============================================================================

adminAxiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ============================================================================
// Response interceptor with automatic 401 -> refresh -> retry
// ============================================================================

adminAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    if (!originalRequest) return Promise.reject(error)

    const shouldRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/verify-2fa") &&
      !originalRequest.url?.includes("/auth/refresh")

    if (!shouldRefresh) return Promise.reject(error)

    originalRequest._retry = true

    if (isRefreshing && refreshPromise) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest })
      })
    }

    isRefreshing = true
    refreshPromise = refreshAccessToken()

    try {
      const newToken = await refreshPromise
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
      }
      processQueue(null, newToken)
      return adminAxiosInstance(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError as Error, null)
      setTimeout(() => {
        window.location.href = "/admin/login"
      }, 100)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  }
)

export default adminAxiosInstance
