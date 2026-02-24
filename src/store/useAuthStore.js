import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import {
  login,
  signup,
  UserLogout,
  loadUser as loadUserAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  loginWithGoogle,
} from "@api/authApi"
import {
  getProfile,
  getTransactions,
  markNotificationsAsRead,
  updateUserProfile,
} from "@api/userApi"
import { unsubscribeUser } from "@api/otherApi"
import { pushToDataLayer } from "@utils/DataLayer"
import { toast } from "sonner"

// Utils
const saveToken = token => localStorage.setItem("token", token)
const removeToken = () => localStorage.removeItem("token")
const getToken = () => localStorage.getItem("token")

const useAuthStore = create(
  devtools(
    (set, get) => ({
      user: null,
      token: getToken(),
      loading: false,
      error: null,
      isAuthenticated: !!getToken(),
      forgotMessage: null,
      resetMessage: null,
      transactions: [],
      profileLoading: false,
      unsubscribeSuccessMessage: null,

      // Actions
      setUser: user => set({ user, isAuthenticated: !!user }),

      setToken: token => {
        saveToken(token)
        set({ token, isAuthenticated: true })
      },

      clearAuth: () => {
        removeToken()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          unsubscribeSuccessMessage: null,
        })
      },

      resetUnsubscribe: () => set({ unsubscribeSuccessMessage: null, error: null, loading: false }),

      // Socket Actions
      updateCredits: credits => {
        const user = get().user
        if (user) {
          set({ user: { ...user, credits } })
        }
      },

      addNotification: notification => {
        const user = get().user
        if (user) {
          const notifications = user.notifications
            ? [notification, ...user.notifications]
            : [notification]
          set({ user: { ...user, notifications } })
        }
      },

      updateUserPartial: updates => {
        const user = get().user
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      // Async Actions
      loginUser: async ({ email, password, captchaToken }) => {
        set({ loading: true, error: null })
        try {
          const { user, token } = await login({ email, password, captchaToken })
          if (token && user) {
            saveToken(token)
            pushToDataLayer({
              event: "login_attempt",
              event_status: "success",
              auth_method: "email_password",
              user_id: user._id,
              user_subscription: user.subscription.plan,
            })
            set({ user, token, isAuthenticated: true, loading: false })
            return { user, token }
          }
          throw new Error("Invalid login response")
        } catch (err) {
          pushToDataLayer({
            event: "login_attempt",
            event_status: "fail",
            auth_method: "email_password",
            error_msg: err?.message || err?.response?.data?.message || "Login Failed",
          })
          const errorMsg = err?.response?.data?.message || err.message || "Login failed"
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      signupUser: async ({ email, password, name, captchaToken, referralId }) => {
        set({ loading: true, error: null })
        try {
          const { user, token } = await signup({ email, password, name, captchaToken, referralId })
          if (token && user) {
            saveToken(token)
            pushToDataLayer({
              event: "sign_up_attempt",
              event_status: "success",
              auth_method: "email_password",
              user_id: user._id,
              user_subscription: user.subscription.plan,
            })
            set({ user, token, isAuthenticated: true, loading: false })
            return { user, token }
          }
          throw new Error("Invalid signup response")
        } catch (err) {
          pushToDataLayer({
            event: "sign_up_attempt",
            event_status: "fail",
            auth_method: "email_password",
            error_msg: err?.message || err?.response?.data?.message || "Signup Failed",
          })
          const errorMsg = err?.response?.data?.message || err.message || "Signup failed"
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      googleLogin: async ({ access_token, referralId }) => {
        set({ loading: true, error: null })
        try {
          const response = await loginWithGoogle({ access_token, referralId })
          if (!response.success || !response.token || !response.user) {
            throw new Error("Invalid Google login response")
          }

          saveToken(response.token)
          const { user, authStatus } = response

          pushToDataLayer({
            ...(authStatus == "sign_up"
              ? { event: "sign_up_attempt" }
              : { event: "google_auth", event_type: authStatus }),
            event_status: "success",
            auth_method: "google_oauth",
            user_id: user._id,
            user_subscription: user.subscription.plan,
          })

          set({ user, token: response.token, isAuthenticated: true, loading: false })
          return response
        } catch (error) {
          pushToDataLayer({
            event: "google_auth",
            event_status: "fail",
            auth_method: "google_oauth",
            error_msg: error?.message || error?.response?.data?.message || "Google Login Failed",
          })
          const errorMsg = error?.response?.data?.message || error.message || "Google Login Failed"
          set({ loading: false, error: errorMsg })
          throw error
        }
      },

      loadAuthenticatedUser: async () => {
        const token = getToken()
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false })
          return
        }

        set({ loading: true }) // Don't reset error here potentially to keep previous error visible? Or yes reset.
        try {
          const data = await loadUserAPI()
          if (data?.success && data?.user) {
            set({ user: data.user, token, isAuthenticated: true, loading: false })
            return { user: data.user, token }
          } else {
            throw new Error("Failed to load user")
          }
        } catch (err) {
          // If load fails (e.g. invalid token), clear auth
          removeToken()
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: err.message,
          })
          throw err
        }
      },

      logoutUser: async () => {
        try {
          await UserLogout()
        } catch (err) {
          console.warn("Logout API failed", err)
        }
        removeToken()
        set({ user: null, token: null, isAuthenticated: false, error: null })
        // Could also clear other stores here if needed
      },

      forgotPassword: async email => {
        set({ loading: true, error: null, forgotMessage: null })
        try {
          const data = await forgotPasswordAPI(email)
          set({ loading: false, forgotMessage: data })
          return data
        } catch (err) {
          const errorMsg = err.response?.data?.error || "Failed to send reset link"
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      resetPassword: async ({ token, newPassword }) => {
        set({ loading: true, error: null, resetMessage: null })
        try {
          const data = await resetPasswordAPI(token, newPassword)
          set({ loading: false, resetMessage: data.message })
          return data.message
        } catch (err) {
          const errorMsg = err.response?.data?.error || "Failed to reset password"
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      // User Actions from userSlice
      fetchUserProfile: async () => {
        set({ profileLoading: true, error: null })
        try {
          const data = await getProfile()
          set({ user: data, isAuthenticated: true, profileLoading: false })
          return data
        } catch (error) {
          toast.error("Failed to fetch user profile")
          set({ profileLoading: false, error: error.message })
          throw error
        }
      },

      markAllNotificationsAsRead: async () => {
        set({ loading: true })
        try {
          const response = await markNotificationsAsRead()
          const updatedNotifications = response.updatedNotifications || []
          const user = get().user
          if (user) {
            set({
              user: { ...user, notifications: user.notifications.map(n => ({ ...n, read: true })) },
            })
          }
          set({ loading: false })
          return updatedNotifications
        } catch (error) {
          const errorMsg = error.response?.data?.message || "Failed to mark notifications as read."
          toast.error(errorMsg)
          set({ loading: false, error: errorMsg })
          throw error
        }
      },

      fetchTransactions: async () => {
        set({ loading: true, error: null })
        try {
          const data = await getTransactions()
          set({ transactions: data || [], loading: false })
          return data || []
        } catch (error) {
          toast.error("Failed to fetch transactions")
          set({ loading: false, error: error.message })
          throw error
        }
      },

      updateProfile: async payload => {
        set({ loading: true, error: null })
        try {
          const data = await updateUserProfile(payload)
          // Refetch profile after update
          const updatedUser = await getProfile()
          set({ user: updatedUser, loading: false })
          return data
        } catch (error) {
          toast.error("Error updating profile, try again")
          set({ loading: false, error: error.message })
          throw error
        }
      },

      unsubscribeAction: async email => {
        set({ loading: true, error: null, unsubscribeSuccessMessage: null })
        try {
          const data = await unsubscribeUser(email)
          set({ loading: false, unsubscribeSuccessMessage: data })
          return data
        } catch (err) {
          const errorMsg = err.message || "Failed to unsubscribe"
          set({ loading: false, error: errorMsg })
          throw err
        }
      },
    }),
    { name: "auth-store" }
  )
)

export default useAuthStore
