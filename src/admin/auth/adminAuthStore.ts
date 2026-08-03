import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { adminLogin, consumeWriteAccess, requestWriteAccess } from "../features/auth/api/authApi"
import type { AdminUser } from "@admin/types/admin"
import {
  getAuthToken,
  getCurrentUser,
  isAuthenticated as hasStoredToken,
  removeAuthToken,
  setAuthToken,
  setCurrentUser,
} from "./authToken"

interface AdminAuthState {
  user: AdminUser | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  // Sessions are read-only by default. This only reflects elevation performed
  // in the current tab (e.g. after consuming an emailed link) — it is not
  // fetched from the server on load, so treat "false" as "unknown, assume read-only".
  isWriteElevated: boolean

  loginAdmin: (email: string, password: string) => Promise<AdminUser>
  requestWriteAccess: () => Promise<string>
  consumeWriteAccess: (token: string) => Promise<string>
  logoutAdmin: () => void
}

const useAdminAuthStore = create<AdminAuthState>()(
  devtools(
    (set) => ({
      user: getCurrentUser(),
      token: getAuthToken(),
      loading: false,
      error: null,
      isAuthenticated: hasStoredToken(),
      isWriteElevated: false,

      loginAdmin: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const data = await adminLogin(email, password)
          setAuthToken(data.accessToken)
          setCurrentUser(data.user)
          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
            isWriteElevated: false,
            loading: false,
          })
          return data.user
        } catch (err) {
          const message = err instanceof Error ? err.message : "Admin login failed"
          set({ loading: false, error: message })
          throw err
        }
      },

      requestWriteAccess: async () => {
        const data = await requestWriteAccess()
        return data.message
      },

      consumeWriteAccess: async (token) => {
        const data = await consumeWriteAccess(token)
        set({ isWriteElevated: true })
        return data.message
      },

      logoutAdmin: () => {
        removeAuthToken()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isWriteElevated: false,
          error: null,
        })
      },
    }),
    { name: "admin-auth-store" }
  )
)

export default useAdminAuthStore
