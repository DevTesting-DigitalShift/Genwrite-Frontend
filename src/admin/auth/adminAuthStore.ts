import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { adminLogin, adminVerify2FA } from "../features/auth/api/authApi"
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
  mfaRequired: boolean
  mfaEnabled: boolean
  tempToken: string | null

  loginAdmin: (
    email: string,
    password: string
  ) => Promise<{ mfaRequired: boolean; mfaEnabled: boolean; tempToken?: string }>
  verifyAdminOtp: (tempToken: string, otp: string) => Promise<AdminUser>
  setAdminSession: (token: string, user: AdminUser) => void
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
      mfaRequired: false,
      mfaEnabled: false,
      tempToken: null,

      loginAdmin: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const data = await adminLogin(email, password)

          // MFA-skip path: credentials valid, session created immediately
          if (!data.mfaRequired && data.accessToken && data.user) {
            setAuthToken(data.accessToken)
            setCurrentUser(data.user)
            set({ user: data.user, token: data.accessToken, isAuthenticated: true, loading: false })
            return { mfaRequired: false, mfaEnabled: false }
          }

          set({
            mfaRequired: true,
            mfaEnabled: data.mfaEnabled,
            tempToken: data.tempToken ?? null,
            loading: false,
          })
          return { mfaRequired: true, mfaEnabled: data.mfaEnabled, tempToken: data.tempToken }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Admin login failed"
          set({ loading: false, error: message })
          throw err
        }
      },

      verifyAdminOtp: async (tempToken, otp) => {
        set({ loading: true, error: null })
        try {
          const data = await adminVerify2FA(tempToken, otp)
          setAuthToken(data.accessToken)
          setCurrentUser(data.user)
          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
            mfaRequired: false,
            tempToken: null,
            loading: false,
          })
          return data.user
        } catch (err) {
          const message = err instanceof Error ? err.message : "OTP verification failed"
          set({ loading: false, error: message })
          throw err
        }
      },

      setAdminSession: (token, user) => {
        setAuthToken(token)
        setCurrentUser(user)
        set({ user, token, isAuthenticated: true })
      },

      logoutAdmin: () => {
        removeAuthToken()
        set({ user: null, token: null, isAuthenticated: false, error: null })
      },
    }),
    { name: "admin-auth-store" }
  )
)

export default useAdminAuthStore
