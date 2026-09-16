// src/api/Auth/Auth.api.ts
import { apiGet, apiPost, ApiRequestError, rethrow } from "@api/typedClient"
import { getActiveSession, removeSession } from "@utils/sessionStore"
import type { ApiRequestBody } from "@/types/apiHelpers"

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

export const AuthAPI = {
  // `ip` is appended before posting but isn't part of the documented request schema (the
  // backend accepts it as an undocumented enrichment field, not something the validator
  // requires) — real fields (email/password/captchaToken) still get full type-checking.
  login: async (reqBody: ApiRequestBody<"/auth/login", "post">) => {
    try {
      const ip = await getIP()
      return await apiPost("/auth/login", { ...reqBody, ip } as never)
    } catch (err) {
      return rethrow(err, "Login failed")
    }
  },

  signup: async (body: ApiRequestBody<"/auth/register", "post">) => {
    try {
      const ip = await getIP()
      return await apiPost("/auth/register", { ...body, ip } as never)
    } catch (err) {
      return rethrow(err, "Signup failed")
    }
  },

  logout: async () => {
    // Session removal from storage is owned by useAuthStore.logoutUser (via
    // sessionStore), which calls this first — this function only hits the backend.
    return await apiGet("/auth/logout")
  },

  loadUser: async (navigate?: (path: string) => void) => {
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
      return await retry(() => apiGet("/auth/me"), 2, 250)
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
  },

  forgotPassword: async (email: string) => {
    return await apiPost("/auth/forgot-password", { email })
  },

  resetPassword: async (payload: ApiRequestBody<"/auth/reset-password", "post">) => {
    return await apiPost("/auth/reset-password", payload as never)
  },

  loginWithGoogle: async (body: ApiRequestBody<"/auth/google-signin", "post">) => {
    try {
      return await apiPost("/auth/google-signin", body as never)
    } catch (err) {
      return rethrow(err, "Google login failed")
    }
  },

  refreshSession: async (userId: string) => {
    return await apiPost("/auth/refresh", { userId })
  },

  logoutAllDevices: async () => {
    return await apiPost("/auth/logout-all")
  },

  verifyEmail: async (code: string) => {
    return await apiPost("/auth/verify-email", { code } as never)
  },

  resendVerification: async () => {
    return await apiPost("/auth/resend-verification-email")
  },
}
