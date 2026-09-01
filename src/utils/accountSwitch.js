import { queryClient } from "@utils/queryClient"
import { disconnectSocket, connectSocket } from "@utils/socket"
import * as sessionStore from "@utils/sessionStore"
import useAuthStore from "@store/useAuthStore"
import useWorkspaceStore from "@store/useWorkspaceStore"
import useJobStore from "@store/useJobStore"
import useBlogStore from "@store/useBlogStore"
import useBrandStore from "@store/useBrandStore"
import useAnalysisStore from "@store/useAnalysisStore"
import useGscStore from "@store/useGscStore"
import useContentStore from "@store/useContentStore"
import useCreditLogStore from "@store/useCreditLogStore"
import useImageStore from "@store/useImageStore"

// Every account-scoped Zustand store that caches data in plain (non-persisted) module
// state and would otherwise leak from one account into another across a switch.
const ACCOUNT_SCOPED_STORES = [
  useJobStore,
  useBlogStore,
  useBrandStore,
  useAnalysisStore,
  useGscStore,
  useContentStore,
  useCreditLogStore,
  useImageStore,
]

/** Full teardown for "signing out of everything" — no account remains to switch into. */
export function clearAllAccountState() {
  disconnectSocket()
  clearAccountScopedState()
}

function clearAccountScopedState() {
  queryClient.clear()
  for (const store of ACCOUNT_SCOPED_STORES) {
    store.getState().reset?.()
  }
  // No account should silently inherit another account's "viewing a shared
  // workspace" context.
  useWorkspaceStore.getState().exitToOwnWorkspace()
}

/**
 * Switches the active account to an already-added session, refetching that user's
 * profile and reconnecting the socket, then clearing every other account-scoped
 * cache/store so nothing from the previous account leaks into the new one.
 * @param {string} userId
 * @param {{navigate?: (path: string) => void, redirectTo?: string}} [options] - redirectTo
 *   overrides the landing route, e.g. a freshly signed-up second account goes to
 *   /onboarding rather than straight to the dashboard.
 */
export async function switchToAccount(userId, { navigate, redirectTo = "/dashboard" } = {}) {
  disconnectSocket()
  clearAccountScopedState()

  const { token } = await useAuthStore.getState().switchAccount(userId)

  connectSocket(token)

  if (navigate) navigate(redirectTo, { replace: true })
  else window.location.href = redirectTo
}

/**
 * Removes the current session and, if any others remain, switches to the next one.
 * If none remain, the caller (useAuthStore.logoutUser) falls back to redirecting to
 * /login itself.
 * @returns {string | null} the next active userId, or null if no sessions remain
 */
export async function switchToNextOrNull(removedUserId, { navigate } = {}) {
  const nextUserId = sessionStore.removeSession(removedUserId)
  disconnectSocket()
  clearAccountScopedState()

  if (!nextUserId) return null

  const { token } = await useAuthStore.getState().switchAccount(nextUserId)
  connectSocket(token)

  if (navigate) navigate("/dashboard")
  else window.location.href = "/dashboard"

  return nextUserId
}
