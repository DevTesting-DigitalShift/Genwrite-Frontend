import axios from "axios"
import { toast } from "sonner"
import useWorkspaceStore from "@store/useWorkspaceStore"
import {
  getActiveSession,
  removeSession,
  hasAnySession,
  SESSION_EXPIRED_EVENT,
} from "@utils/sessionStore"
import { getAccessToken } from "@utils/accessTokenStore"

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1`, // Replace with your API base URL
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

function readCsrfCookie() {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

// Endpoints that establish a *new* identity. While adding a second account the previous
// account is still the active session, so attaching its Bearer token (or its shared
// workspace scope) to these calls would authenticate the request as the wrong user.
const UNAUTHENTICATED_ROUTES = ["/auth/login", "/auth/register", "/auth/google-signin"]

const isUnauthenticatedRoute = (url = "") => UNAUTHENTICATED_ROUTES.some((r) => url.includes(r))

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    }
    if (isUnauthenticatedRoute(config.url)) {
      return config
    }
    // Add JWT token if available
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const csrfToken = readCsrfCookie()
    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken
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
  async (error) => {
    const status = error.response ? error.response.status : null

    // 1. Throttled 429 Too Many Requests
    if (status === 429) {
      const now = Date.now()
      if (now - last429Toast > 5000) {
        toast.error("Too many requests. Please try after some time.")
        last429Toast = now
      }
    }

    // 2. Stale watch context. The workspace persisted for this tab no longer has an
    //    accepted invite — the owner revoked it, or the database was restored from a
    //    dump predating it. The X-Watch-As header can never succeed again, so exit to
    //    our own workspace and replay the request once. Without this every scoped read
    //    fails with a 403 that nothing surfaces, and the UI just renders empty forever.
    if (
      status === 403 &&
      error.response?.data?.message?.includes("No active watcher access") &&
      !error.config?._watchContextRetried
    ) {
      useWorkspaceStore.getState().exitToOwnWorkspace()
      toast.error("That shared workspace is no longer available. Switched back to your account.")

      const retryConfig = { ...error.config, _watchContextRetried: true }
      // The request interceptor won't re-add the header now that activeWorkspace is
      // null, but this config already carries it — strip it either way.
      if (typeof retryConfig.headers?.delete === "function") {
        retryConfig.headers.delete("X-Watch-As")
      } else if (retryConfig.headers) {
        delete retryConfig.headers["X-Watch-As"]
      }
      return axiosInstance(retryConfig)
    }

    // 3. Read-only workspace write attempt — surface the backend's message as a safety net
    //    for any write action we didn't proactively gate in the UI.
    if (status === 403 && error.response?.data?.message?.includes("Read-only access")) {
      toast.error(error.response.data.message)
    }

    // 4. Only delete token for 401 Unauthorized
    if (status === 401) {
      console.warn(`Token removed due to HTTP ${status}`)
      const expiredSession = getActiveSession()
      // adoptNext: false — this tab must not silently start acting as another logged-in
      // account behind the session-expired modal. The user chooses there.
      if (expiredSession) removeSession(expiredSession.userId, { adoptNext: false })

      // Detect public blog path to prevent forced redirect
      const isPublicPath =
        window.location.pathname.startsWith("/blog/") &&
        !window.location.pathname.startsWith("/blog-editor")

      if (!isPublicPath) {
        if (hasAnySession()) {
          // Another account is still logged in — let SessionExpiredModal (mounted at
          // the app root) offer re-authenticate/switch instead of nuking the page.
          window.dispatchEvent(
            new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { email: expiredSession?.email } })
          )
        } else if (window.location.pathname !== "/login") {
          toast.error("Session expired. Please login again.")
          setTimeout(() => {
            window.location.href = "/login"
          }, 1500)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
