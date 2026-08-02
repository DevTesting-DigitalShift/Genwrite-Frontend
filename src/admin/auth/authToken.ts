import type { AdminUser } from "@admin/types/admin"

/**
 * Storage type options for admin authentication
 * - "session": Uses sessionStorage - more secure, clears on browser close
 * - "local": Uses localStorage - persists across browser sessions
 */
export type StorageType = "session" | "local"

/** @default "local" */
export const ADMIN_STORAGE_TYPE: StorageType = "local"

// Storage keys — deliberately distinct from the end-user app's "token" key
// so an admin session never collides with an end-user session.
export const AUTH_TOKEN_KEY = "admin_token"
export const AUTH_USER_KEY = "admin_user"
export const TEMP_TOKEN_KEY = "admin_temp_token"
export const TEMP_TOKEN_EXPIRY_KEY = "admin_temp_token_expiry"

export type { AdminUser }

const getStorage = (): Storage =>
  ADMIN_STORAGE_TYPE === "local" ? window.localStorage : window.sessionStorage

export const isAuthenticated = (): boolean => !!getStorage().getItem(AUTH_TOKEN_KEY)

export const getAuthToken = (): string | null => getStorage().getItem(AUTH_TOKEN_KEY)

export const setAuthToken = (token: string): void => {
  getStorage().setItem(AUTH_TOKEN_KEY, token)
}

export const removeAuthToken = (): void => {
  getStorage().removeItem(AUTH_TOKEN_KEY)
  getStorage().removeItem(AUTH_USER_KEY)
}

export const getCurrentUser = (): AdminUser | null => {
  const userStr = getStorage().getItem(AUTH_USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr) as AdminUser
  } catch {
    return null
  }
}

export const setCurrentUser = (user: AdminUser): void => {
  getStorage().setItem(AUTH_USER_KEY, JSON.stringify(user))
}

/**
 * Clears admin auth state. Note: httpOnly refresh cookie is cleared by the
 * backend on next login or by the browser when it expires.
 */
export const logout = (): void => {
  removeAuthToken()
  removeTempToken()
  window.location.href = "/admin/login"
}

// ============================================================================
// MFA/2FA temp-token state (5 minute expiry)
// ============================================================================

export const getTempToken = (): string | null => {
  const expiry = getStorage().getItem(TEMP_TOKEN_EXPIRY_KEY)
  if (expiry && Date.now() > Number.parseInt(expiry, 10)) {
    removeTempToken()
    return null
  }
  return getStorage().getItem(TEMP_TOKEN_KEY)
}

export const setTempToken = (token: string): void => {
  getStorage().setItem(TEMP_TOKEN_KEY, token)
  const expiryTime = Date.now() + 5 * 60 * 1000
  getStorage().setItem(TEMP_TOKEN_EXPIRY_KEY, expiryTime.toString())
}

export const removeTempToken = (): void => {
  getStorage().removeItem(TEMP_TOKEN_KEY)
  getStorage().removeItem(TEMP_TOKEN_EXPIRY_KEY)
}

export const getTempTokenRemainingTime = (): number => {
  const expiry = getStorage().getItem(TEMP_TOKEN_EXPIRY_KEY)
  if (!expiry) return 0
  const remaining = Math.max(0, Number.parseInt(expiry, 10) - Date.now())
  return Math.floor(remaining / 1000)
}

export const isTempTokenValid = (): boolean => getTempTokenRemainingTime() > 0
