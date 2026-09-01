import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  login,
  signup,
  UserLogout,
  loadUser as loadUserAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  loginWithGoogle,
  refreshSession as refreshSessionAPI,
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
import { getFriendlyError } from "@utils/friendlyError"
import * as sessionStore from "@utils/sessionStore"
import { switchToNextOrNull, clearAllAccountState } from "@utils/accountSwitch"
import { setAccessToken } from "@utils/accessTokenStore"

const removeToken = () => {
  const active = sessionStore.getActiveSession()
  if (active) sessionStore.removeSession(active.userId)
}

// Several independent components (PrivateRoutesLayout, Dashboard, SideBar_Header,
// Profile, Transactions, Onboarding, PublicBlogReader) each call
// loadAuthenticatedUser() from their own mount effect. That was harmless when it was
// a synchronous local read, but it now performs a single-use refresh-token rotation
// over the network — concurrent calls race for the same one-time cookie, and the
// server's reuse-detection revokes the whole session on the losers. Dedup so any
// number of simultaneous callers share one in-flight refresh.
let loadAuthPromise = null

const useAuthStore = create(
  devtools(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      forgotMessage: null,
      resetMessage: null,
      transactions: [],
      profileLoading: false,
      unsubscribeSuccessMessage: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        setAccessToken(token)
        set({ token, isAuthenticated: true })
      },

      clearAuth: () => {
        removeToken()
        setAccessToken(null)
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
      updateCredits: (credits) => {
        const user = get().user
        if (user) {
          set({ user: { ...user, credits } })
        }
      },

      addNotification: (notification) => {
        const user = get().user
        if (user) {
          const notifications = user.notifications
            ? [notification, ...user.notifications]
            : [notification]
          set({ user: { ...user, notifications } })
        }
      },

      updateUserPartial: (updates) => {
        const user = get().user
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      // Async Actions
      loginUser: async ({ email, password, captchaToken }) => {
        set({ loading: true, error: null })
        try {
          const { user, accessToken } = await login({ email, password, captchaToken })
          if (accessToken && user) {
            sessionStore.upsertSession({ user })
            pushToDataLayer({
              event: "login_attempt",
              event_status: "success",
              auth_method: "email_password",
              user_id: user._id,
              user_subscription: user.subscription.plan,
            })
            get().setToken(accessToken)
            set({ user, loading: false })
            return { user, token: accessToken }
          }
          throw new Error("Invalid login response")
        } catch (err) {
          pushToDataLayer({
            event: "login_attempt",
            event_status: "fail",
            auth_method: "email_password",
            error_msg: err?.message || err?.response?.data?.message || "Login Failed",
          })
          const errorMsg = getFriendlyError(err, "login")
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      signupUser: async ({ email, password, name, captchaToken, referralId }) => {
        set({ loading: true, error: null })
        try {
          const { user, accessToken } = await signup({ email, password, name, captchaToken, referralId })
          if (accessToken && user) {
            sessionStore.upsertSession({ user })
            pushToDataLayer({
              event: "sign_up_attempt",
              event_status: "success",
              auth_method: "email_password",
              user_id: user._id,
              user_subscription: user.subscription.plan,
            })
            get().setToken(accessToken)
            set({ user, loading: false })
            return { user, token: accessToken }
          }
          throw new Error("Invalid signup response")
        } catch (err) {
          pushToDataLayer({
            event: "sign_up_attempt",
            event_status: "fail",
            auth_method: "email_password",
            error_msg: err?.message || err?.response?.data?.message || "Signup Failed",
          })
          const errorMsg = getFriendlyError(err, "signup")
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      googleLogin: async ({ access_token, referralId }) => {
        set({ loading: true, error: null })
        try {
          const response = await loginWithGoogle({ access_token, referralId })
          if (!response.success || !response.accessToken || !response.user) {
            throw new Error("Invalid Google login response")
          }

          sessionStore.upsertSession({ user: response.user })
          const { user, authStatus } = response

          pushToDataLayer({
            ...(authStatus === "sign_up"
              ? { event: "sign_up_attempt" }
              : { event: "google_auth", event_type: authStatus }),
            event_status: "success",
            auth_method: "google_oauth",
            user_id: user._id,
            user_subscription: user.subscription.plan,
          })

          get().setToken(response.accessToken)
          set({ user, loading: false })
          return response
        } catch (error) {
          pushToDataLayer({
            event: "google_auth",
            event_status: "fail",
            auth_method: "google_oauth",
            error_msg: error?.message || error?.response?.data?.message || "Google Login Failed",
          })
          const errorMsg = getFriendlyError(error, "google")
          set({ loading: false, error: errorMsg })
          throw error
        }
      },

      loadAuthenticatedUser: async () => {
        if (loadAuthPromise) return loadAuthPromise

        const active = sessionStore.getActiveSession()
        if (!active) {
          set({ user: null, token: null, isAuthenticated: false })
          return
        }

        set({ loading: true })
        loadAuthPromise = (async () => {
          try {
            const { accessToken } = await refreshSessionAPI(active.userId)
            setAccessToken(accessToken)
            set({ token: accessToken })

            const data = await loadUserAPI()
            if (data?.success && data?.user) {
              sessionStore.upsertSession({ user: data.user })
              set({ user: data.user, token: accessToken, isAuthenticated: true, loading: false })
              return { user: data.user, token: accessToken }
            } else {
              throw new Error("Failed to load user")
            }
          } catch (err) {
            // Token invalid/expired — clear auth silently, no error state needed
            removeToken()
            set({ user: null, token: null, isAuthenticated: false, loading: false, error: null })
            throw err
          } finally {
            loadAuthPromise = null
          }
        })()

        return loadAuthPromise
      },

      switchAccount: async (userId) => {
        set({ loading: true, error: null })
        try {
          const { accessToken } = await refreshSessionAPI(userId)
          setAccessToken(accessToken)
          sessionStore.setActiveUserId(userId)
          set({ token: accessToken, loading: false })

          const data = await loadUserAPI()
          if (data?.success && data?.user) {
            sessionStore.upsertSession({ user: data.user })
            set({ user: data.user, isAuthenticated: true })
            return { user: data.user, token: accessToken }
          }
          throw new Error("Failed to load user after switching accounts")
        } catch (err) {
          set({ loading: false, error: getFriendlyError(err, "general") })
          throw err
        }
      },

      logoutUser: async () => {
        try {
          await UserLogout()
        } catch (err) {
          console.warn("Logout API failed", err)
        }
        const currentUserId = sessionStore.getActiveSession()?.userId
        setAccessToken(null)
        set({ user: null, token: null, isAuthenticated: false, error: null })
        if (currentUserId) {
          // Removes this session and, if another logged-in account remains in this
          // browser, switches to it instead of bouncing to /login.
          const nextUserId = await switchToNextOrNull(currentUserId)
          return { switchedToAnotherAccount: !!nextUserId }
        }
        return { switchedToAnotherAccount: false }
      },

      /** Signs out of every logged-in account in this browser. */
      logoutAllAccounts: async () => {
        for (const session of sessionStore.getSessions()) {
          try {
            await get().switchAccount(session.userId)
            await UserLogout()
          } catch (err) {
            console.warn(`Logout API failed for ${session.email}`, err)
          }
        }
        sessionStore.removeAllSessions()
        // logoutUser gets this teardown for free via switchToNextOrNull; this path has to
        // do it itself, or the socket stays connected and the query cache survives into
        // whoever logs in next.
        clearAllAccountState()
        setAccessToken(null)
        set({ user: null, token: null, isAuthenticated: false, error: null })
      },

      forgotPassword: async (email) => {
        set({ loading: true, error: null, forgotMessage: null })
        try {
          const data = await forgotPasswordAPI(email)
          set({ loading: false, forgotMessage: data })
          return data
        } catch (err) {
          const errorMsg = getFriendlyError(err, "general")
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
          const errorMsg = getFriendlyError(err, "general")
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
              user: {
                ...user,
                notifications: user.notifications.map((n) => ({ ...n, read: true })),
              },
            })
          }
          set({ loading: false })
          return updatedNotifications
        } catch (error) {
          toast.error("Failed to update notification status. Please try again.")
          set({ loading: false, error: "Failed to mark notifications as read." })
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

      updateProfile: async (payload) => {
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

      unsubscribeAction: async (email) => {
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
