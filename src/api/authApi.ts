import { apiGet, apiPost, ApiRequestError } from "./typedClient"
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
  } catch (rawErr) {
    console.error("IP Fecth Error", rawErr)
    return ""
  }
}

// Utility function to retry API calls
const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (rawError) {
      if (i === retries - 1) throw rawError // Throw on last retry
      await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i)) // Exponential backoff
    }
  }
  // Unreachable: the final iteration either returns or throws above.
  throw new Error("retry: exhausted without a result")
}

export const login = async (reqBody: Record<string, unknown>) => {
  try {
    reqBody.ip = await getIP()
    return await apiPost("/api/v1/auth/login", reqBody as never)
  } catch (err) {
    if (err instanceof ApiRequestError) throw new Error(err.message || "Login failed")
    throw err instanceof Error ? err : new Error("Login failed")
  }
}

export const signup = async (body: Record<string, unknown>) => {
  try {
    body.ip = await getIP()
    return await apiPost("/api/v1/auth/register", body as never)
  } catch (err) {
    if (err instanceof ApiRequestError) throw new Error(err.message || "Signup failed")
    throw err instanceof Error ? err : new Error("Signup failed")
  }
}

export const UserLogout = async () => {
  // Session removal from storage is owned by useAuthStore.logoutUser (via
  // sessionStore), which calls this first — this function only hits the backend.
  return await apiGet("/api/v1/auth/logout")
}

export const loadUser = async (navigate?: (path: string) => void) => {
  // Check if a session exists before making the API call — the access token itself
  // now lives only in memory and is refreshed separately; this just checks there's
  // an account to try authenticating.
  const session = getActiveSession()
  if (!session) {
    navigate?.("/login")
    throw new Error("No authentication token found")
  }

  try {
    // Retry the API call up to 3 times with exponential backoff
    return await retry(() => apiGet("/api/v1/auth/me"), 2, 250)
  } catch (rawError) {
    // `status` is undefined for any request that never got a response at all (network
    // failure, timeout, CORS, DNS) — a more complete check than axios's own ERR_NETWORK
    // code, which only covers one of those cases.
    const status = rawError instanceof ApiRequestError ? rawError.status : undefined
    const gotNoResponse = rawError instanceof ApiRequestError && status === undefined

    if (status === 401 || status === 403) {
      // Unauthorized or Forbidden: Clear token and redirect to login
      removeActiveSession()
      navigate?.("/login")
      throw new Error("Session expired. Please log in again.")
    } else if (gotNoResponse) {
      // Network error: Show user-friendly message without redirecting
      console.error("Network error: Backend server not reachable")
      throw new Error("Unable to connect to the server. Please try again later.")
    } else {
      // Other errors: Log and throw without redirecting
      console.error("Auth Error:", rawError)
      throw new Error("User loading failed")
    }
  }
}

export const forgotPasswordAPI = async (email: string) => {
  return await apiPost("/api/v1/auth/forgot-password", { email })
}

export const resetPasswordAPI = async (token: string, newPassword: unknown) => {
  return await apiPost("/api/v1/auth/reset-password", { token, newPassword } as never)
}

export const loginWithGoogle = async (body: Record<string, unknown>) => {
  try {
    return await apiPost("/api/v1/auth/google-signin", body as never)
  } catch (err) {
    if (err instanceof ApiRequestError) throw new Error(err.message || "Google login failed")
    throw err instanceof Error ? err : new Error("Google login failed")
  }
}

export const refreshSession = async (userId: string) => {
  return await apiPost("/api/v1/auth/refresh", { userId })
}

export const logoutAllDevicesAPI = async () => {
  return await apiPost("/api/v1/auth/logout-all")
}
