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
  window.location.href = "/admin/login"
}
