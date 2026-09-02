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
import { apiErrorMessage, asApiError } from "@/types/api"
import { getFriendlyError } from "@utils/friendlyError"
import * as sessionStore from "@utils/sessionStore"
import { switchToNextOrNull, clearAllAccountState } from "@utils/accountSwitch"

// Utils — delegate to the multi-account session layer instead of a single
// localStorage["token"]. loginUser/signupUser/googleLogin call sessionStore.upsertSession
// directly (they already have the user object), so this generic helper only covers the
// token-only cases (setToken action, loadAuthenticatedUser's silent refresh).
const getToken = () => sessionStore.getActiveToken()
const removeToken = () => {
  const active = sessionStore.getActiveSession()
  if (active) sessionStore.removeSession(active.userId)
}

/** The authenticated user as returned by /user/profile and the auth endpoints. */
export interface AuthUser {
  _id?: string
  email?: string
  name?: string
  avatar?: string
  createdAt?: string
  plan?: string
  trialOpted?: boolean
  credits?: { base?: number; extra?: number }
  subscription?: {
    plan?: string
    status?: string
    startDate?: string
    renewalDate?: string
    /** A future date when the subscription will be cancelled. */
    cancelAt?: string
    /** A past date when the user cancelled. */
    canceledAt?: string
    trialOpted?: boolean
    stripeSubscriptionId?: string
    stripeCustomerId?: string
    discountApplied?: number
    billingPeriod?: string
    paymentFailedSince?: string
    scheduledPlanChange?: {
      newPlan?: string
      newBillingPeriod?: string
      effectiveDate?: string
    }
  }
  notifications?: unknown[]
  referral?: { referralId?: string }
  [key: string]: any
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  forgotMessage: string | null
  resetMessage: string | null
  transactions: unknown[]
  profileLoading: boolean
  unsubscribeSuccessMessage: string | null

  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  clearAuth: () => void
  resetUnsubscribe: () => void
  updateCredits: (credits: AuthUser["credits"]) => void
  addNotification: (notification: unknown) => void
  updateUserPartial: (updates: Partial<AuthUser>) => void

  loginUser: (args: { email: string; password: string; captchaToken?: string }) => Promise<unknown>
  signupUser: (args: {
    email: string
    password: string
    name: string
    captchaToken?: string
    referralId?: string
  }) => Promise<unknown>
  googleLogin: (args: { access_token: string; referralId?: string }) => Promise<unknown>
  loadAuthenticatedUser: () => Promise<unknown>
  logoutUser: () => Promise<unknown>
  logoutAllAccounts: () => Promise<unknown>
  forgotPassword: (email: string) => Promise<unknown>
  resetPassword: (args: { token: string; newPassword: string }) => Promise<unknown>
  fetchUserProfile: () => Promise<unknown>
  markAllNotificationsAsRead: () => Promise<unknown>
  fetchTransactions: () => Promise<unknown>
  updateProfile: (payload: unknown) => Promise<unknown>
  unsubscribeAction: (email: string) => Promise<unknown>
}
const useAuthStore = create<AuthState>()(
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
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) sessionStore.updateActiveSessionToken(token)
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
          const { user, accessToken: token } = await login({ email, password, captchaToken })
          if (token && user) {
            sessionStore.upsertSession({ user, token })
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
            error_msg: apiErrorMessage(err, "Login Failed"),
          })
          const errorMsg = getFriendlyError(err, "login")
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      signupUser: async ({ email, password, name, captchaToken, referralId }) => {
        set({ loading: true, error: null })
        try {
          const { user, accessToken: token } = await signup({ email, password, name, captchaToken, referralId })
          if (token && user) {
            sessionStore.upsertSession({ user, token })
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
            error_msg: apiErrorMessage(err, "Signup Failed"),
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
          // The backend names this field `accessToken` (auth.controller.js#googleSignIn);
          // `token` is the client-side name used by sessionStore and this store's state.
          const token = response.accessToken
          if (!response.success || !token || !response.user) {
            throw new Error("Invalid Google login response")
          }

          sessionStore.upsertSession({ user: response.user, token })
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

          set({ user, token, isAuthenticated: true, loading: false })
          return response
        } catch (error) {
          pushToDataLayer({
            event: "google_auth",
            event_status: "fail",
            auth_method: "google_oauth",
            error_msg: apiErrorMessage(error, "Google Login Failed"),
          })
          const errorMsg = getFriendlyError(error, "google")
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
            // Patches the placeholder "pending" session left by the legacy-token
            // migration, and keeps the session list's name/avatar/email fresh for the
            // account switcher UI.
            sessionStore.upsertSession({ user: data.user, token })
            set({ user: data.user, token, isAuthenticated: true, loading: false })
            return { user: data.user, token }
          } else {
            throw new Error("Failed to load user")
          }
        } catch (err) {
          // Token invalid/expired — clear auth silently, no error state needed
          removeToken()
          set({ user: null, token: null, isAuthenticated: false, loading: false, error: null })
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
            sessionStore.setActiveUserId(session.userId)
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
          set({ profileLoading: false, error: asApiError(error).message })
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
                notifications: (user.notifications ?? []).map((n) => ({
                  ...(n as Record<string, unknown>),
                  read: true,
                })),
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
          set({ loading: false, error: asApiError(error).message })
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
          set({ loading: false, error: asApiError(error).message })
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
          const errorMsg = apiErrorMessage(err, "Failed to unsubscribe")
          set({ loading: false, error: errorMsg })
          throw err
        }
      },
    }),
    { name: "auth-store" }
  )
)

export default useAuthStore
