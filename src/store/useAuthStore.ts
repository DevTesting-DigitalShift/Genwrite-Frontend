import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { authQuery } from "@api/Auth/Auth.query"
import { userQuery } from "@api/User/User.query"
import { unsubscribeUser } from "@api/otherApi"
import { pushToDataLayer } from "@utils/DataLayer"
import { apiErrorMessage } from "@/types/api"
import { getFriendlyError } from "@utils/friendlyError"
import * as sessionStore from "@utils/sessionStore"
import { switchToNextOrNull, clearAllAccountState } from "@utils/accountSwitch"
import { setAccessToken } from "@utils/accessTokenStore"

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
  // Generated coerced-date fields come through the openapi pipeline as `string | null`,
  // not just `string` — same quirk as BlogPosting.postedOn elsewhere in this codebase.
  createdAt?: string | null
  plan?: string
  trialOpted?: boolean
  credits?: { base?: number; extra?: number }
  subscription?: {
    plan?: string
    status?: string
    // Same nullable-coerced-date quirk as createdAt above.
    startDate?: string | null
    renewalDate?: string | null
    /** A future date when the subscription will be cancelled. */
    cancelAt?: string | null
    /** A past date when the user cancelled. */
    canceledAt?: string | null
    trialOpted?: boolean
    stripeSubscriptionId?: string
    stripeCustomerId?: string
    discountApplied?: number
    billingPeriod?: string
    paymentFailedSince?: string | null
    scheduledPlanChange?: {
      newPlan?: string
      newBillingPeriod?: string
      effectiveDate?: string | null
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
  switchAccount: (userId: string) => Promise<{ user: AuthUser; token: string }>
  logoutUser: () => Promise<unknown>
  logoutAllAccounts: () => Promise<unknown>
  forgotPassword: (email: string) => Promise<unknown>
  resetPassword: (args: { token: string; newPassword: string }) => Promise<unknown>
  fetchUserProfile: () => Promise<unknown>
  markAllNotificationsAsRead: () => Promise<unknown>
  unsubscribeAction: (email: string) => Promise<unknown>
}

// Several independent components (PrivateRoutesLayout, Dashboard, SideBar_Header,
// Profile, Transactions, Onboarding, PublicBlogReader) each call
// loadAuthenticatedUser() from their own mount effect. That was harmless when it was
// a synchronous local read, but it now performs a single-use refresh-token rotation
// over the network — concurrent calls race for the same one-time cookie, and the
// server's reuse-detection revokes the whole session on the losers. Dedup so any
// number of simultaneous callers share one in-flight refresh.
let loadAuthPromise: Promise<unknown> | null = null

const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      forgotMessage: null,
      resetMessage: null,
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
          // captchaToken is required by the backend schema but can genuinely be undefined
          // here (reCAPTCHA not yet resolved) — same pre-existing gap the legacy
          // Record<string, unknown> signature masked, left as-is.
          const { user, accessToken } = await authQuery.login({
            email,
            password,
            captchaToken,
          } as never)
          if (accessToken && user) {
            sessionStore.upsertSession({ user })
            pushToDataLayer({
              event: "login_attempt",
              event_status: "success",
              auth_method: "email_password",
              user_id: user._id,
              user_subscription: user.subscription?.plan,
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
          // Same pre-existing captchaToken-can-be-undefined gap as loginUser above.
          const { user, accessToken } = await authQuery.signup({
            email,
            password,
            name,
            captchaToken,
            referralId,
          } as never)
          if (accessToken && user) {
            sessionStore.upsertSession({ user })
            pushToDataLayer({
              event: "sign_up_attempt",
              event_status: "success",
              auth_method: "email_password",
              user_id: user._id,
              user_subscription: user.subscription?.plan,
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
          const response = await authQuery.loginWithGoogle({ access_token, referralId })
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
            user_subscription: user.subscription?.plan,
          })

          get().setToken(response.accessToken)
          set({ user, loading: false })
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
        if (loadAuthPromise) return loadAuthPromise

        const active = sessionStore.getActiveSession()
        if (!active) {
          set({ user: null, token: null, isAuthenticated: false })
          return
        }

        set({ loading: true })
        loadAuthPromise = (async () => {
          try {
            const { accessToken } = await authQuery.refreshSession(active.userId)
            setAccessToken(accessToken)
            set({ token: accessToken })

            const data = await authQuery.loadUser()
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
          const { accessToken } = await authQuery.refreshSession(userId)
          setAccessToken(accessToken)
          sessionStore.setActiveUserId(userId)
          set({ token: accessToken, loading: false })

          const data = await authQuery.loadUser()
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
          await authQuery.logout()
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
            await authQuery.logout()
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
          const data = await authQuery.forgotPassword(email)
          set({ loading: false, forgotMessage: data.message })
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
          const data = await authQuery.resetPassword({ token, newPassword })
          set({ loading: false, resetMessage: data.message })
          return data.message
        } catch (err) {
          const errorMsg = getFriendlyError(err, "general")
          set({ loading: false, error: errorMsg })
          throw err
        }
      },

      fetchUserProfile: async () => {
        set({ loading: true, error: null })
        try {
          const data = await userQuery.getProfile()
          set({ user: data, isAuthenticated: true, loading: false })
          return data
        } catch (error) {
          set({ loading: false, error: apiErrorMessage(error, "Failed to fetch user profile") })
          throw error
        }
      },

      markAllNotificationsAsRead: async () => {
        set({ loading: true })
        try {
          // 204 No Content — the backend confirms success but sends nothing back, so
          // "mark every notification read" has to happen locally.
          await userQuery.markNotificationsAsRead()
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
        } catch (error) {
          set({ loading: false, error: "Failed to mark notifications as read." })
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
